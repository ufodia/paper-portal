declare module 'js-aruco2' {
  interface Corner {
    x: number;
    y: number;
  }
  interface Marker {
    id: number;
    corners: Corner[];
    hammingDistance: number;
  }
  interface Image {
    data: Uint8ClampedArray;
    width: number;
    height: number;
  }
  const aruco: {
    AR: {
      Dictionary: new (name: string) => { generateSVG(id: number): string };
      Detector: new (configuration: { dictionaryName: string; maxHammingDistance?: number }) => {
        detect(image: Image): Marker[];
      };
    };
  };
  export default aruco;
}
