PHONY: build check install install-upstream

build:
	bun run build:bin

check:
	bun run typecheck
	bun test
	bun run test:tty-smoke

install: build
	bun run install:bin

install-upstream:
	npm install -g --force hunkdiff-upstream@npm:hunkdiff
