#!/bin/bash

# This is probably subject to change--fill it in with info from
# http://nlp.stanford.edu/software/lex-parser.shtml
DATE=2015-04-20
VERSION=3.5.2

cd "metrical-tree/stanford-library/stanford-parser-full-$DATE"
jar xf stanford-parser-$VERSION-models.jar

python -c "import nltk; nltk.download('punkt')"

cd ../../..
celery -A tasks worker --loglevel=info