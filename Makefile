# -*- Makefile -*-

PRINT_TARGET ?= @echo $@

# Prefixing with EE (Exam Engine) just in case we'll do includes later
EE_DIR = .
EE_NVM_DIR=$(HOME)/.nvm

EE_NVM_EXEC=$(EE_NVM_DIR)/nvm-exec
EE_NODE=$(EE_NVM_EXEC) node
EE_YARN=$(EE_NVM_EXEC) yarn
EE_YARN_INSTALLED=$(EE_DIR)/node_modules/.yarn_install_executed
EE_EXAM_ENGINE_BUILT=$(EE_DIR)/packages/exam-engine/dist/main-bundle.js

# Change @ to empty string "" if you want to see all commands echoed:
VERBOSE?=@

$(EE_YARN_INSTALLED): $(EE_DIR)/package.json $(EE_DIR)/yarn.lock $(EE_NVM_EXEC)
	$(PRINT_TARGET)
	$(VERBOSE)$(EE_NVM_EXEC) yarn install --pure-lockfile
	$(VERBOSE)touch $@

$(EE_EXAM_ENGINE_BUILT):
	$(PRINT_TARGET)
	$(EE_NVM_EXEC) yarn workspace @digabi/exam-engine-core build

start: build
	$(EE_NVM_EXEC) yarn start

build: $(EE_YARN_INSTALLED)
	$(PRINT_TARGET)
	$(EE_NVM_EXEC) yarn build

clean:
	$(PRINT_TARGET)
	$(VERBOSE)rm -rf $(EE_DIR)/node_modules
	$(VERBOSE)rm -rf $(EE_DIR)/packages/*/dist
	$(VERBOSE)rm $(EE_DIR)/packages/*/tslint.xml 2>/dev/null || true	
	$(VERBOSE)rm $(EE_DIR)/packages/*/jest-report.xml 2>/dev/null || true		
	$(VERBOSE)rm $(EE_DIR)/packages/*/tsconfig.tsbuildinfo 2>/dev/null || true		

test: build
	$(PRINT_TARGET)
	$(EE_NVM_EXEC) yarn test

unit-tests-ci: build
	$(PRINT_TARGET)
	$(EE_NVM_EXEC) yarn test --test-path-ignore-patterns packages/rendering

browser-tests-ci: build
	$(PRINT_TARGET)
	$(EE_NVM_EXEC) yarn test packages/rendering

lint: $(EE_YARN_INSTALLED)
	$(PRINT_TARGET)
	$(EE_NVM_EXEC) yarn lint --fix

lint-ci: $(EE_YARN_INSTALLED)
	$(PRINT_TARGET)
	$(EE_NVM_EXEC) yarn lint -t checkstyle -o tslint.xml
