export class Block {
  #center;
  #isDotOccupied;
  type;
  #dots;
  #dotMap;
  #getDots;
  #offsetsMap;
  #getDotsCoordinates;
  #getStops;
  #rotateMap;
  constructor(arr, name) {
    this.#center = [...arr];
    this.type = name;
    this.#dotMap = {
      I: [0, 1, 2, 7],
      Z: [0, 6, 7, 10],
      S: [0, 4, 7, 9],
      T: [0, 4, 7, 10],
      O: [0, 4, 6, 7],
      L: [0, 1, 6, 7],
      J: [0, 1, 7, 9],
    };
    this.#getDots = () => {
      if (this.#dotMap[this.type]) {
        this.#dots = this.#dotMap[this.type];
      } else {
        throw new Error(
          "Ошибка в getDots! Передан некорректный ключ фигуры! Допустимые значения: 'I', 'Z', 'S', 'T', 'O', 'L', 'J'"
        );
      }
    };
    this.#getDots();
    this.#offsetsMap = [
      [0, 0],
      [-1, 0],
      [-2, 0],
      [-1, 1],
      [0, 1],
      [0, 2],
      [1, 1],
      [1, 0],
      [2, 0],
      [1, -1],
      [0, -1],
      [0, -2],
      [-1, -1],
    ];
    this.#getDotsCoordinates = () => {
      this.dotsCoordinates = this.#dots.map((dot) => {
        if (dot >= 0 || dot < this.#offsetsMap.length) {
          return [
            this.#center[0] + this.#offsetsMap[dot][0],
            this.#center[1] + this.#offsetsMap[dot][1],
          ];
        } else {
          throw new Error(
            'Ошибка в findDotsCoordinates! Передан неизвестный вариант расположения точки. Допустимые значения: 0-12'
          );
        }
      });
    };
    this.#getDotsCoordinates();
    this.#isDotOccupied = (y, x) =>
      this.dotsCoordinates.some((coord) => y === coord[0] && x === coord[1]);
    this.#rotateMap = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3];
    this.#getStops = () => {
      this.bottomStops = this.dotsCoordinates
        .map((coord) =>
          this.#isDotOccupied(coord[0] + 1, coord[1])
            ? null
            : [coord[0] + 1, coord[1]]
        )
        .filter(Boolean);
      this.rightStops = this.dotsCoordinates
        .map((coord) =>
          this.#isDotOccupied(coord[0], coord[1] + 1)
            ? null
            : [coord[0], coord[1] + 1]
        )
        .filter(Boolean);
      this.leftStops = this.dotsCoordinates
        .map((coord) =>
          this.#isDotOccupied(coord[0], coord[1] - 1)
            ? null
            : [coord[0], coord[1] - 1]
        )
        .filter(Boolean);
      this.rotateStops = this.#dots
        .map((dot) => this.#rotateMap[dot])
        .map((dot) => [
          this.#center[0] + this.#offsetsMap[dot][0],
          this.#center[1] + this.#offsetsMap[dot][1],
        ]);
    };
    this.#getStops();
    this.rotate = () => {
      this.#dots = this.#dots.map((dot) => this.#rotateMap[dot]);
      this.#getDotsCoordinates();
      this.#getStops();
    };
    this.moveDown = () => {
      this.#center[0] += 1;
      this.#getDotsCoordinates();
      this.#getStops();
    };
    this.moveRight = () => {
      this.#center[1] += 1;
      this.#getDotsCoordinates();
      this.#getStops();
    };
    this.moveLeft = () => {
      this.#center[1] -= 1;
      this.#getDotsCoordinates();
      this.#getStops();
    };
  }
}
