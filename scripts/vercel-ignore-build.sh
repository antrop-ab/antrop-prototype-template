#!/usr/bin/env bash
# Vercel kör det här skriptet före varje bygge (vercel.json → ignoreCommand).
# Exit 0 = hoppa över bygget, exit 1 = bygg.
#
# Byggen kostar pengar på Vercel. Claude-sessioner pushar ofta till egna
# grenar (claude/...), och varje push blev förut ett eget bygge. Därför byggs
# bara main (huvudlänken) och grenar som uttryckligen ska ha en egen länk:
# variant-* (varianter att visa) och preview-* (förhandslänk till en PR).
case "${VERCEL_GIT_COMMIT_REF:-main}" in
  main | variant-* | preview-*) exit 1 ;;
  *) echo "Hoppar över bygget av grenen ${VERCEL_GIT_COMMIT_REF}. Bara main, variant-* och preview-* byggs."; exit 0 ;;
esac
