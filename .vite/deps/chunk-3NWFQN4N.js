import {
  IN_BROWSER,
  templateRef
} from "./chunk-3PQ7XZCE.js";
import {
  onBeforeUnmount,
  readonly,
  ref,
  watch
} from "./chunk-IJV5NOMV.js";

// node_modules/vuetify/lib/composables/resizeObserver.mjs
function useResizeObserver(callback) {
  let box = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "content";
  const resizeRef = templateRef();
  const contentRect = ref();
  if (IN_BROWSER) {
    const observer = new ResizeObserver((entries) => {
      callback == null ? void 0 : callback(entries, observer);
      if (!entries.length) return;
      if (box === "content") {
        contentRect.value = entries[0].contentRect;
      } else {
        contentRect.value = entries[0].target.getBoundingClientRect();
      }
    });
    onBeforeUnmount(() => {
      observer.disconnect();
    });
    watch(() => resizeRef.el, (newValue, oldValue) => {
      if (oldValue) {
        observer.unobserve(oldValue);
        contentRect.value = void 0;
      }
      if (newValue) observer.observe(newValue);
    }, {
      flush: "post"
    });
  }
  return {
    resizeRef,
    contentRect: readonly(contentRect)
  };
}

export {
  useResizeObserver
};
//# sourceMappingURL=chunk-3NWFQN4N.js.map
