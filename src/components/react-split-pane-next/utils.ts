export function getUnit(size:  string) {
  if (size.endsWith('px')) {
    return 'px';
  }

  if (size.endsWith('%')) {
    return '%';
  }

  return 'ratio';
}

export function convertSizeToCssValue(value:string, resizerSize?:number|string) {
  if (getUnit(value) !== '%') {
    return value;
  }

  if (!resizerSize) {
    return value;
  }

  const idx = value.search('%|px');
  const percent = Number.parseInt(value.slice(0, idx)) / 100;
  if (percent === 0) {
    return value;
  }

  return `calc(${value} - ${resizerSize}px*${percent})`;
}

export function toValue(value:string):number {
  if (getUnit(value) !== 'px') {
    return 0;
  }

  const idx = value.search('px');
  return Number.parseInt(value.slice(0, idx));

}

export function convertToUnit(size:number, unit:string, containerSize:number) {
  switch (unit) {
    case '%':
      return `${((size / containerSize) * 100).toFixed(2)}%`;
    case 'px':
      return `${size.toFixed(2)}px`;
    case 'ratio':
      return (size * 100).toFixed(0);
  }
}

export function toPx(value:number, unit = 'px', size:number) {
  switch (unit) {
    case '%': {
      return +((size * value) / 100).toFixed(2);
    }
    default: {
      return +value;
    }
  }
}

export function convert(str:string, size:number) {
  const tokens = str.match(/([0-9]+)([px|%]*)/);
  if (!tokens) {
    return 0;
  }
  const value = Number.parseInt(tokens[1]);
  const unit = tokens[2];
  return toPx(value, unit, size);
}
