#!/usr/bin/env python3
"""KirMoon: dados de contato reais (e-mail, WhatsApp) e rodapé sem CNPJ.
Usage: python3 patch_contact_info.py <in.html> <out.html>   (preserves CRLF)"""
import sys
src, dst = sys.argv[1], sys.argv[2]
text = open(src, 'rb').read().decode('utf-8')
R = [
  ('contato@kirmoon.com.br', 'contato@kirmoon.com', 3, 'email'),
  ('<strong>(00) 00000-0000</strong>', '<strong>(81) 98938-9297</strong>', 1, 'phone text'),
  ('const WHATSAPP = "5500000000000"; // troque pelo número da Kirmoon (55 + DDD + número)',
   'const WHATSAPP = "5581989389297"; // Kirmoon: (81) 98938-9297', 1, 'whatsapp'),
  ('Kirmoon Dev Solutions LTDA · CNPJ 00.000.000/0001-00', 'Kirmoon Dev Solutions LTDA', 1, 'footer'),
]
for old, new, want, label in R:
    n = text.count(old)
    if n != want:
        sys.exit(f'anchor "{label}" found {n} times (expected {want}); aborting')
    text = text.replace(old, new)
open(dst, 'wb').write(text.encode('utf-8'))
print('ok', len(text.encode()))
