import EmberArray, { A } from '@ember/array';
namespace EmberArray {
  // detect is an intimate Mixin API, likely should not be typed upstream
  function detect(arr: any): boolean;
}

export default EmberArray;
export { A };
