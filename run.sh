#!/bin/sh
#start konsole -e "php -S 127.0.0.1:8000"
#xdg-open http://localhost:8000/
tsc --watch freecell/freecell.ts \
    --lib es2015,dom \
    --target es2024 \
    --sourceMap

