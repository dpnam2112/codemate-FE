import {
  genericComponent,
  propsFactory,
  provideDefaults
} from "./chunk-3PQ7XZCE.js";
import {
  toRefs
} from "./chunk-IJV5NOMV.js";

// node_modules/vuetify/lib/components/VDefaultsProvider/VDefaultsProvider.mjs
var makeVDefaultsProviderProps = propsFactory({
  defaults: Object,
  disabled: Boolean,
  reset: [Number, String],
  root: [Boolean, String],
  scoped: Boolean
}, "VDefaultsProvider");
var VDefaultsProvider = genericComponent(false)({
  name: "VDefaultsProvider",
  props: makeVDefaultsProviderProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const {
      defaults,
      disabled,
      reset,
      root,
      scoped
    } = toRefs(props);
    provideDefaults(defaults, {
      reset,
      root,
      scoped,
      disabled
    });
    return () => {
      var _a;
      return (_a = slots.default) == null ? void 0 : _a.call(slots);
    };
  }
});

export {
  VDefaultsProvider
};
//# sourceMappingURL=chunk-UGW3QIBN.js.map
