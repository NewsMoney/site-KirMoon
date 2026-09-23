#!/usr/bin/env python3
"""KirMoon: nome da aba do navegador como "KirMoon". Usage: patch_title.py <in> <out>"""
import sys
t = open(sys.argv[1], 'rb').read().decode('utf-8')
old, new = '<title>Kirmoon</title>', '<title>KirMoon</title>'
if t.count(old) != 1: sys.exit('title anchor not found once; aborting')
open(sys.argv[2], 'wb').write(t.replace(old, new).encode('utf-8')); print('ok')
