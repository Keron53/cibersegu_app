#!/bin/bash

#create sign field
#pip install uharfbuzz
#pip install fontTools



pyhanko sign addfields \
 --field  5/97,586,187,636/ela \
 --field  5/200,586,290,636/rev \
 --field  5/297,586,480,636/apr \
  input.pdf output.pdf

pyhanko sign addsig --style-name noto-qr --field ela pkcs12 --passfile passfile output.pdf signed.pdf my_cert.p12

