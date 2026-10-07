#!/usr/bin/env python3
"""Fix Services -> Process wheel entry and resize coherence in kirmoon_site.html.
Usage: python3 patch_scroll.py <in.html> <out.html>
Exact-match replacements; aborts if any anchor is missing or ambiguous. Preserves CRLF."""
import sys

src, dst = sys.argv[1], sys.argv[2]
raw = open(src, 'rb').read().decode('utf-8')
crlf = '\r\n' in raw
text = raw.replace('\r\n', '\n')
if crlf and text.replace('\n', '\r\n') != raw:
    sys.exit('mixed line endings; refusing to patch')

R = []
def rep(old, new, label):
    R.append((old, new, label))

# 1. Resize: re-kick bounded animators, mark in-flight scene target dirty, re-centre Process.
rep('''  addEventListener("resize", () => { queueScroll(); updateProcessShade(); });
  motion.addEventListener("change", queueScroll);
  new ResizeObserver(queueScroll).observe(document.querySelector("main"));''',
'''  // Resize/layout changes: the in-flight scene transition re-resolves its
  // destination, armed boundaries follow the new edge, and a settled Process
  // stays centred instead of keeping a stale scroll offset.
  let sceneGeometryDirty = false;
  let resizeRealignFrame = 0;
  function realignAfterResize() {
    resizeRealignFrame = 0;
    if (serviceBoundaryMode) animateServiceBoundary();
    if (serviceReturnBoundaryMode) animateServiceReturnBoundary();
    if (finalBoundaryMode) animateFinalBoundary();
    if (!desktop.matches || sceneAnimating || processEntryPending || active !== 2 || !processEl) return;
    const processTarget = sceneTargetTop(processEl);
    if (Math.abs(scrollY - processTarget) > 1) scrollTo({top:processTarget, behavior:'instant'});
  }
  function onGeometryChange() {
    sceneGeometryDirty = true;
    queueScroll();
    if (!resizeRealignFrame) resizeRealignFrame = requestAnimationFrame(realignAfterResize);
  }
  addEventListener("resize", () => { onGeometryChange(); updateProcessShade(); });
  motion.addEventListener("change", queueScroll);
  new ResizeObserver(onGeometryChange).observe(document.querySelector("main"));
  // Crossing the 960/961 breakpoint switches navigation models. Drop any bounded
  // wheel state from the old model and re-derive the chapter from position.
  desktop.addEventListener("change", () => {
    if (serviceBoundaryMode) stopServiceBoundaryMode();
    if (serviceReturnBoundaryMode) stopServiceReturnBoundaryMode();
    if (finalBoundaryMode) stopFinalBoundaryMode();
    resetServiceBoundaryIntent();
    setIntent(0);
    flow.resetGesture();
    if (desktop.matches && !sceneAnimating && !processEntryPending) {
      const line = innerHeight * .5, hit = el => { const r = el?.getBoundingClientRect(); return r && r.top <= line && r.bottom > line; };
      const finalRect = finalStart && finalEnd ? {top:finalStart.getBoundingClientRect().top,bottom:finalEnd.getBoundingClientRect().bottom} : null;
      const index = scrollY < 8 || hit(heroEl) ? 0 : hit(serviceStart) ? 1 : hit(processEl) ? 2
        : finalRect && finalRect.top <= line && finalRect.bottom > line ? 3 : -1;
      if (index >= 0 && !flow.transitioning) {
        active = index;
        flow.commitChapter(index,{position:scrollY,hash:'#'+chapters[index].id});
        selectChapter(index);
      }
    }
    onGeometryChange();
  });''', 'resize listeners')

# 2. Services bottom boundary: an armed entry follows the (possibly moved) edge.
rep('''      serviceBoundaryTarget = Math.min(serviceBoundaryTarget, boundaryTop);
      const dt = serviceBoundaryLastFrame''',
'''      serviceBoundaryTarget = serviceBoundaryEntryReady ? boundaryTop : Math.min(serviceBoundaryTarget, boundaryTop);
      const dt = serviceBoundaryLastFrame''', 'service boundary target')

# 3. Services top (return) boundary: same for the upward direction.
rep('''      serviceReturnBoundaryTarget=Math.max(serviceReturnBoundaryTarget,boundaryTop);''',
'''      serviceReturnBoundaryTarget=serviceReturnBoundaryEntryReady?boundaryTop:Math.max(serviceReturnBoundaryTarget,boundaryTop);''',
'service return boundary target')

# 4. Final boundary: same.
rep('''      finalBoundaryTarget = Math.max(finalBoundaryTarget, boundaryTop);''',
'''      finalBoundaryTarget = finalBoundaryEntryReady ? boundaryTop : Math.max(finalBoundaryTarget, boundaryTop);''',
'final boundary target')

# 5. Scene animation: optional resolver re-reads the destination after geometry changes.
rep('''  function animateSceneTo(targetTop, onDone, profile = DEFAULT_SCENE_PROFILE) {
    cancelAnimationFrame(sceneRaf);
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const start = scrollY;
    const distance = targetTop - start;''',
'''  function animateSceneTo(targetTop, onDone, profile = DEFAULT_SCENE_PROFILE, resolveTarget = null) {
    cancelAnimationFrame(sceneRaf);
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const start = scrollY;
    let distance = targetTop - start;
    sceneGeometryDirty = false;''', 'animateSceneTo head')

rep('''    const frame = now => {
      const t = Math.min(1, (now - started) / duration);
      const p = interpolate(t);
      scrollTo({top:start + distance * p, behavior:'instant'});''',
'''    const frame = now => {
      if (sceneGeometryDirty && resolveTarget) {
        sceneGeometryDirty = false;
        const resolved = resolveTarget();
        if (Number.isFinite(resolved)) { targetTop = resolved; distance = targetTop - start; }
      }
      const t = Math.min(1, (now - started) / duration);
      const p = interpolate(t);
      scrollTo({top:start + distance * p, behavior:'instant'});''', 'animateSceneTo frame')

# 6. goToChapter passes a resolver for its destination.
rep('''    const targetTop = (target === finalStart || target === serviceStart)
      ? Math.max(0, scrollY + target.getBoundingClientRect().top - top.offsetHeight)
      : sceneTargetTop(target);''',
'''    const resolveChapterTop = () => (target === finalStart || target === serviceStart)
      ? Math.max(0, scrollY + target.getBoundingClientRect().top - top.offsetHeight)
      : sceneTargetTop(target);
    const targetTop = resolveChapterTop();''', 'goToChapter target')

rep('''        animateSceneTo(targetTop, commitChapter, enteringProcess ? PROCESS_SCENE_PROFILE : DEFAULT_SCENE_PROFILE);''',
'''        animateSceneTo(targetTop, commitChapter, enteringProcess ? PROCESS_SCENE_PROFILE : DEFAULT_SCENE_PROFILE, resolveChapterTop);''',
'goToChapter animate')

# 7. Services -> Process entry: once the glide already sits on the edge, any further
#    downward wheel arms the entry. The 60-unit overflow sum stays for fast gestures,
#    but small, spaced mouse-wheel steps no longer depend on it.
rep('''        const desired = serviceBoundaryTarget + magnitude;
        serviceBoundaryTarget = Math.min(serviceBoundaryTop, desired);
        const overflow = Math.max(0, desired - serviceBoundaryTop);
        if (overflow > 0) {
          const intent = addServiceBoundaryIntent(overflow);
          rail.style.setProperty('--intent', Math.min(1, intent / SERVICE_ENTRY_THRESHOLD).toFixed(3));
          if (intent >= SERVICE_ENTRY_THRESHOLD) serviceBoundaryEntryReady = true;
        }''',
'''        // Target already on the edge before this step: the user is pushing past
        // the end of Services, so arm the entry regardless of step size or pause.
        const targetAtEdge = serviceBoundaryTop - serviceBoundaryTarget <= 1;
        const desired = serviceBoundaryTarget + magnitude;
        serviceBoundaryTarget = Math.min(serviceBoundaryTop, desired);
        const overflow = Math.max(0, desired - serviceBoundaryTop);
        if (overflow > 0) {
          const intent = addServiceBoundaryIntent(overflow);
          rail.style.setProperty('--intent', Math.min(1, intent / SERVICE_ENTRY_THRESHOLD).toFixed(3));
          if (targetAtEdge || intent >= SERVICE_ENTRY_THRESHOLD) serviceBoundaryEntryReady = true;
        }''', 'service entry arming')

# 8. Process -> Services wheel return also follows geometry.
rep('''            if(pending) animateSceneTo(serviceReturnTop,()=>{flow.completeTransition(performance.now());commitProcessReturnToServices();},PROCESS_SCENE_PROFILE);
          }
        }
      }
      return;''',
'''            const resolveServiceReturnTop=()=>Math.max(0,scrollY+serviceEnd.getBoundingClientRect().bottom-innerHeight);
            if(pending) animateSceneTo(serviceReturnTop,()=>{flow.completeTransition(performance.now());commitProcessReturnToServices();},PROCESS_SCENE_PROFILE,resolveServiceReturnTop);
          }
        }
      }
      return;''', 'process return animate')

for old, new, label in R:
    n = text.count(old)
    if n != 1:
        sys.exit(f'anchor "{label}" found {n} times; aborting without writing')
    text = text.replace(old, new)

out = text.replace('\n', '\r\n') if crlf else text
open(dst, 'wb').write(out.encode('utf-8'))
print(f'patched {len(R)} sites; crlf={crlf}; {len(out.encode())} bytes')
