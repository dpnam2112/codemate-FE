import {
  propsFactory
} from "./chunk-3PQ7XZCE.js";
import {
  computed,
  shallowRef,
  watch
} from "./chunk-IJV5NOMV.js";

// node_modules/vuetify/lib/composables/lazy.mjs
var makeLazyProps = propsFactory({
  eager: Boolean
}, "lazy");
function useLazy(props, active) {
  const isBooted = shallowRef(false);
  const hasContent = computed(() => isBooted.value || props.eager || active.value);
  watch(active, () => isBooted.value = true);
  function onAfterLeave() {
    if (!props.eager) isBooted.value = false;
  }
  return {
    isBooted,
    hasContent,
    onAfterLeave
  };
}

export {
  makeLazyProps,
  useLazy
};
//# sourceMappingURL=chunk-QTIEVBQ2.js.map
