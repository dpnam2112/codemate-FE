import {
  getCurrentInstanceName,
  propsFactory
} from "./chunk-3PQ7XZCE.js";
import {
  computed
} from "./chunk-IJV5NOMV.js";

// node_modules/vuetify/lib/composables/density.mjs
var allowedDensities = [null, "default", "comfortable", "compact"];
var makeDensityProps = propsFactory({
  density: {
    type: String,
    default: "default",
    validator: (v) => allowedDensities.includes(v)
  }
}, "density");
function useDensity(props) {
  let name = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : getCurrentInstanceName();
  const densityClasses = computed(() => {
    return `${name}--density-${props.density}`;
  });
  return {
    densityClasses
  };
}

export {
  makeDensityProps,
  useDensity
};
//# sourceMappingURL=chunk-3TBKGRGC.js.map
