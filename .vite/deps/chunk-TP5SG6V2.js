import {
  effectScope,
  onScopeDispose,
  watch
} from "./chunk-IJV5NOMV.js";

// node_modules/vuetify/lib/composables/toggleScope.mjs
function useToggleScope(source, fn) {
  let scope;
  function start() {
    scope = effectScope();
    scope.run(() => fn.length ? fn(() => {
      scope == null ? void 0 : scope.stop();
      start();
    }) : fn());
  }
  watch(source, (active) => {
    if (active && !scope) {
      start();
    } else if (!active) {
      scope == null ? void 0 : scope.stop();
      scope = void 0;
    }
  }, {
    immediate: true
  });
  onScopeDispose(() => {
    scope == null ? void 0 : scope.stop();
  });
}

export {
  useToggleScope
};
//# sourceMappingURL=chunk-TP5SG6V2.js.map
