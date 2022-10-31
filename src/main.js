(function() {
  'use strict';
  const version = 'Version: 2022.11.01';

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const size = 35;
  const offset = 5;
  const elems = {};

  window.addEventListener('DOMContentLoaded', init, false);

  function init() {
    elems.version = document.getElementById('version-info');
    elems.version.innerText = version;
    elems.svg = document.getElementById('svg-board');
    const g = createG();
    elems.svg.appendChild(g);

    {
      const rect = createRect({
        x: 1,
        y: 1,
        width: 15,
        height: 15,
      });
      rect.setAttribute('fill', 'white');
      rect.setAttribute('stroke', 'none');
      g.appendChild(rect);
    }

    {
      const rect = createRect({
        x: 1,
        y: 0,
        width: 15,
        height: 1,
      });
      rect.setAttribute('fill', '#ffffdd');
      rect.setAttribute('stroke', 'none');
      g.appendChild(rect);
    }

    {
      const rect = createRect({
        x: 0,
        y: 1,
        width: 1,
        height: 15,
      });
      rect.setAttribute('fill', '#ffffdd');
      rect.setAttribute('stroke', 'none');
      g.appendChild(rect);
    }

    for (let y = 0; y <= 16; ++y) {
      const line = createLine({
        x1: y == 0 ? 1 : 0,
        y1: y,
        x2: 16,
        y2: y,
      });
      line.setAttribute('stroke', 'black');
      line.setAttribute('stroke-width', y == 0 || y % 5 == 1 ? 3 : 1);
      g.appendChild(line);
    }
    for (let x = 0; x <= 16; ++x) {
      const line = createLine({
        x1: x,
        y1: x == 0 ? 1 : 0,
        x2: x,
        y2: 16,
      });
      line.setAttribute('stroke', 'black');
      line.setAttribute('stroke-width', x == 0 || x % 5 == 1 ? 3 : 1);
      g.appendChild(line);
    }

    for (let y = 0; y < 16; ++y) {
      for (let x = 0; x < 16; ++x) {
        if (x == 0 || y == 0) {
          if (x + y != 0) {
            const text = createText({
              x: x + 0.5,
              y: y + 0.5,
              text: (x + y).toString(16).toUpperCase(),
            });
            text.setAttribute('font-weight', 'bold');
            g.appendChild(text);
          }
        } else {
          const text = createText({
            x: x + 0.5,
            y: y + 0.5,
            text: (x * y).toString(16).toUpperCase(),
          });
          g.appendChild(text);
        }
      }
    }
  }

  function createG() {
    const g = document.createElementNS(SVG_NS, 'g');
    return g;
  }

  function createText(param) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', param.x * size + offset);
    text.setAttribute('y', param.y * size + offset + 1.5);
    text.textContent = param.text;
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'middle');
    return text;
  }

  function createRect(param) {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', param.x * size + offset);
    rect.setAttribute('y', param.y * size + offset);
    rect.setAttribute('width', param.width * size);
    rect.setAttribute('height', param.height * size);
    return rect;
  }

  function createLine(param) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', param.x1 * size + offset);
    line.setAttribute('y1', param.y1 * size + offset);
    line.setAttribute('x2', param.x2 * size + offset);
    line.setAttribute('y2', param.y2 * size + offset);
    return line;
  }
})();
