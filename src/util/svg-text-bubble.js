const SVGTextWrapper = require('./svg-text-wrapper');
const SVGRenderer = require('../svg-quirks-mode/svg-renderer');

const MAX_LINE_LENGTH = 170;
const MIN_WIDTH = 50;

class SVGTextBubble {
    constructor () {
        this.svgRenderer = new SVGRenderer();
        this.svgTextWrapper = new SVGTextWrapper();
        this._textSizeCache = {};
    }

    _speechBubble (w, h, radius, pointsLeft) {
        let pathString = `
            M 0 ${radius}
            A ${radius} ${radius} 0 0 1 ${radius} 0
            L ${w - radius} 0
            A ${radius} ${radius} 0 0 1 ${w} ${radius}
            L ${w} ${h - radius}
            A ${radius} ${radius} 0 0 1 ${w - radius} ${h}`;

        if (pointsLeft) {
            pathString += `
                L 32 ${h}
                c -5 8 -15 12 -18 12
                a 2 2 0 0 1 -2 -2
                c 0 -2 4 -6 4 -10`;
        } else {
            pathString += `
                L ${w - 16} ${h}
                c 0 4 4 8 4 10
                a 2 2 0 0 1 -2 2
                c -3 0 -13 -4 -18 -12`;
        }

        pathString += `
            L ${radius} ${h}
            A ${radius} ${radius} 0 0 1 0 ${h - radius}
            Z`;

        return `
            <g>
                <path
                  d="${pathString}"
                  stroke="rgba(0, 0, 0, 0.15)"
                  stroke-width="4"
                  fill="rgba(0, 0, 0, 0.15)"
                  stroke-line-join="round"
              />
              <path
                d="${pathString}"
                stroke="none"
                fill="white" />
            </g>`;
    }

    _thinkBubble (w, h, radius, pointsLeft) {
        const e1rx = 2.25;
        const e1ry = 2.25;
        const e2rx = 1.5;
        const e2ry = 1.5;
        const e1x = 16 + 7 + e1rx;
        const e1y = 5 + h + e1ry;
        const e2x = 16 + e2rx;
        const e2y = 8 + h + e2ry;
        const insetR = 4;
        const pInset1 = 12 + radius;
        const pInset2 = pInset1 + (2 * insetR);

        let pathString = `
            M 0 ${radius}
            A ${radius} ${radius} 0 0 1 ${radius} 0
            L ${w - radius} 0
            A ${radius} ${radius} 0 0 1 ${w} ${radius}
            L ${w} ${h - radius}
            A ${radius} ${radius} 0 0 1 ${w - radius} ${h}`;

        if (pointsLeft) {
            pathString += `
                L ${pInset2} ${h}
                A ${insetR} ${insetR} 0 0 1 ${pInset2 - insetR} ${h + insetR}
                A ${insetR} ${insetR} 0 0 1 ${pInset1} ${h}`;
        } else {
            pathString += `
                L ${w - pInset1} ${h}
                A ${insetR} ${insetR} 0 0 1 ${w - pInset1 - insetR} ${h + insetR}
                A ${insetR} ${insetR} 0 0 1 ${w - pInset2} ${h}`;
        }

        pathString += `
            L ${radius} ${h}
            A ${radius} ${radius} 0 0 1 0 ${h - radius}
            Z`;

        const ellipseSvg = (cx, cy, rx, ry) => `
            <g>
                <ellipse
                    cx="${cx}" cy="${cy}"
                    rx="${rx}" ry="${ry}"
                    fill="rgba(0, 0, 0, 0.15)"
                    stroke="rgba(0, 0, 0, 0.15)"
                    stroke-width="4"
                />
                <ellipse
                    cx="${cx}" cy="${cy}"
                    rx="${rx}" ry="${ry}"
                    fill="white"
                    stroke="none"
                />
            </g>`;
        let ellipses = [];
        if (pointsLeft) {
            ellipses = [
                ellipseSvg(e1x, e1y, e1rx, e1ry),
                ellipseSvg(e2x, e2y, e2rx, e2ry)
            ];
        } else {
            ellipses = [
                ellipseSvg(w - e1x, e1y, e1rx, e1ry),
                ellipseSvg(w - e2x, e2y, e2rx, e2ry)
            ];
        }

        return `
             <g>
                <path d="${pathString}" stroke="rgba(0, 0, 0, 0.15)" stroke-width="4" fill="rgba(0, 0, 0, 0.15)" />
                <path d="${pathString}" stroke="none" fill="white" />
                ${ellipses.join('\n')}
            </g>`;
    }


    _getTextSize () {
        const svgString = this._wrapSvgFragment(this._textFragment());
        if (!this._textSizeCache[svgString]) {
            this._textSizeCache[svgString] = this.svgRenderer.measure(svgString);
        }
        return this._textSizeCache[svgString];
    }

    _wrapSvgFragment (fragment) {
        return `
          <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
              ${fragment}
          </svg>
        `;
    }

    _textFragment () {
        return `<text fill="#575E75">${this.lines.join('\n')}</text>`;
    }

    buildString (type, text, pointsLeft) {
        this.type = type;
        this.pointsLeft = pointsLeft;
        this.lines = this.svgTextWrapper.wrapText(MAX_LINE_LENGTH, text);

        let fragment = '';

        const radius = 16;
        const {x, y, width, height} = this._getTextSize();
        const padding = 10;
        const fullWidth = Math.max(MIN_WIDTH, width) + (2 * padding);
        const fullHeight = height + (2 * padding);
        if (this.type === 'say') {
            fragment += this._speechBubble(fullWidth, fullHeight, radius, this.pointsLeft);
        } else {
            fragment += this._thinkBubble(fullWidth, fullHeight, radius, this.pointsLeft);
        }
        fragment += `<g transform="translate(${padding - x}, ${padding - y})">${this._textFragment()}</g>`;
        return this._wrapSvgFragment(fragment);
    }
}

module.exports = SVGTextBubble;
