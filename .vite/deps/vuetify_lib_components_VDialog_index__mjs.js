import {
  VDialogTransition
} from "./chunk-2RGHPH2B.js";
import {
  VDefaultsProvider
} from "./chunk-ZC6VOQCQ.js";
import {
  VOverlay,
  makeVOverlayProps
} from "./chunk-NEMBN5NO.js";
import {
  forwardRefs
} from "./chunk-4TX3OV3G.js";
import "./chunk-ZNOMJ2LV.js";
import {
  useScopeId
} from "./chunk-FKCOJFQF.js";
import "./chunk-S6JDGMD4.js";
import "./chunk-JHDII2JF.js";
import "./chunk-NQNZCBGM.js";
import {
  useProxiedModel
} from "./chunk-HCIWNCCT.js";
import "./chunk-TP5SG6V2.js";
import "./chunk-OPGBKIHZ.js";
import "./chunk-3MLMI5NR.js";
import "./chunk-DNZVU6LE.js";
import "./chunk-5SNBRTN6.js";
import {
  IN_BROWSER,
  focusableChildren,
  genericComponent,
  propsFactory,
  useRender
} from "./chunk-6PPR34VZ.js";
import {
  createVNode,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  ref,
  watch
} from "./chunk-IJV5NOMV.js";
import "./chunk-UVKRO5ER.js";

// node_modules/vuetify/lib/components/VDialog/VDialog.mjs
import "/home/thi/projects/codemate/frontend/node_modules/vuetify/lib/components/VDialog/VDialog.css";
var makeVDialogProps = propsFactory({
  fullscreen: Boolean,
  retainFocus: {
    type: Boolean,
    default: true
  },
  scrollable: Boolean,
  ...makeVOverlayProps({
    origin: "center center",
    scrollStrategy: "block",
    transition: {
      component: VDialogTransition
    },
    zIndex: 2400
  })
}, "VDialog");
var VDialog = genericComponent()({
  name: "VDialog",
  props: makeVDialogProps(),
  emits: {
    "update:modelValue": (value) => true,
    afterEnter: () => true,
    afterLeave: () => true
  },
  setup(props, _ref) {
    let {
      emit,
      slots
    } = _ref;
    const isActive = useProxiedModel(props, "modelValue");
    const {
      scopeId
    } = useScopeId();
    const overlay = ref();
    function onFocusin(e) {
      var _a, _b;
      const before = e.relatedTarget;
      const after = e.target;
      if (before !== after && ((_a = overlay.value) == null ? void 0 : _a.contentEl) && // We're the topmost dialog
      ((_b = overlay.value) == null ? void 0 : _b.globalTop) && // It isn't the document or the dialog body
      ![document, overlay.value.contentEl].includes(after) && // It isn't inside the dialog body
      !overlay.value.contentEl.contains(after)) {
        const focusable = focusableChildren(overlay.value.contentEl);
        if (!focusable.length) return;
        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];
        if (before === firstElement) {
          lastElement.focus();
        } else {
          firstElement.focus();
        }
      }
    }
    onBeforeUnmount(() => {
      document.removeEventListener("focusin", onFocusin);
    });
    if (IN_BROWSER) {
      watch(() => isActive.value && props.retainFocus, (val) => {
        val ? document.addEventListener("focusin", onFocusin) : document.removeEventListener("focusin", onFocusin);
      }, {
        immediate: true
      });
    }
    function onAfterEnter() {
      var _a;
      emit("afterEnter");
      if (((_a = overlay.value) == null ? void 0 : _a.contentEl) && !overlay.value.contentEl.contains(document.activeElement)) {
        overlay.value.contentEl.focus({
          preventScroll: true
        });
      }
    }
    function onAfterLeave() {
      emit("afterLeave");
    }
    watch(isActive, async (val) => {
      var _a;
      if (!val) {
        await nextTick();
        (_a = overlay.value.activatorEl) == null ? void 0 : _a.focus({
          preventScroll: true
        });
      }
    });
    useRender(() => {
      const overlayProps = VOverlay.filterProps(props);
      const activatorProps = mergeProps({
        "aria-haspopup": "dialog"
      }, props.activatorProps);
      const contentProps = mergeProps({
        tabindex: -1
      }, props.contentProps);
      return createVNode(VOverlay, mergeProps({
        "ref": overlay,
        "class": ["v-dialog", {
          "v-dialog--fullscreen": props.fullscreen,
          "v-dialog--scrollable": props.scrollable
        }, props.class],
        "style": props.style
      }, overlayProps, {
        "modelValue": isActive.value,
        "onUpdate:modelValue": ($event) => isActive.value = $event,
        "aria-modal": "true",
        "activatorProps": activatorProps,
        "contentProps": contentProps,
        "height": !props.fullscreen ? props.height : void 0,
        "width": !props.fullscreen ? props.width : void 0,
        "maxHeight": !props.fullscreen ? props.maxHeight : void 0,
        "maxWidth": !props.fullscreen ? props.maxWidth : void 0,
        "role": "dialog",
        "onAfterEnter": onAfterEnter,
        "onAfterLeave": onAfterLeave
      }, scopeId), {
        activator: slots.activator,
        default: function() {
          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }
          return createVNode(VDefaultsProvider, {
            "root": "VDialog"
          }, {
            default: () => {
              var _a;
              return [(_a = slots.default) == null ? void 0 : _a.call(slots, ...args)];
            }
          });
        }
      });
    });
    return forwardRefs({}, overlay);
  }
});
export {
  VDialog
};
//# sourceMappingURL=vuetify_lib_components_VDialog_index__mjs.js.map
