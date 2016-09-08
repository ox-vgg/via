# Makefile to weave and tangle document and source from noweb sources (*.nw)
# A pdf is produced from each woven tex file.
#
# Author: Abhishek Dutta
# Aug. 27, 2016

NOWEAVE=noweave
NOTANGLE=notangle
NOROOTS=noroots
LATEX=pdflatex


REPORT_BASE_DIR = $(shell pwd)
PDF_DIR = $(REPORT_BASE_DIR)"/tex"

NW_FILES = $(wildcard *.nw)
TEX_FILES = $(patsubst %.nw,tex/%.tex,$(NW_FILES))
PDF_FILES = $(patsubst tex/%.tex,tex/%.pdf,$(TEX_FILES))

SRC_FILES = $(wildcard src/*.html)


book : tex pdf
tex : create_dir $(TEX_FILES)

create_dir:
	mkdir -p tex html

pdf:
	$(MAKE) -C tex

tex/%.tex : %.nw
	@echo $<
	#$(NOWEAVE) -autodefs c -delay -index $< > $@
	#$(NOWEAVE) -delay -index $< > $@
	$(NOWEAVE) -delay -x $< > $@

	for srcfn in `$(NOROOTS) $< | grep -o '[^\<]*.html\>\>'`; do \
		$(NOTANGLE) -L -R$$srcfn $< > html/$$srcfn; \
	done

#pdf/%.pdf : tex/%.tex
#	@echo $<
#	$(LATEX) -output-directory=pdf -output-format=PDF '\scrollmode \input '"$<";
#	while grep -s 'Rerun to get cross-references right' pdf/$*.log; do $(LATEX) -output-directory=pdf -output-format=PDF '\scrollmode \input '"$<"; done

clean:
	rm -f $(TEX_FILES) $(SRC_FILES) $(INCLUDE_FILES)
	rm -rf include/ src/
	$(MAKE) -C tex clean

print-%  : ; @echo $* = $($*)
