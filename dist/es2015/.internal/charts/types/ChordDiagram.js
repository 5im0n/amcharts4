/**
 * Chord diagram module.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { FlowDiagram, FlowDiagramDataItem } from "./FlowDiagram";
import { percent } from "../../core/utils/Percent";
import { ListTemplate } from "../../core/utils/List";
import { DictionaryTemplate } from "../../core/utils/Dictionary";
import { Container } from "../../core/Container";
import { registry } from "../../core/Registry";
import { ChordNode } from "../elements/ChordNode";
import { ChordLink } from "../elements/ChordLink";
import * as $iter from "../../core/utils/Iterator";
import * as $math from "../../core/utils/Math";
import * as $type from "../../core/utils/Type";
import * as $utils from "../../core/utils/Utils";
/**
 * ============================================================================
 * DATA ITEM
 * ============================================================================
 * @hidden
 */
//@todo rearange notes after dragged
/**
 * Defines a [[DataItem]] for [[ChordDiagram]].
 *
 * @see {@link DataItem}
 */
var ChordDiagramDataItem = /** @class */ (function (_super) {
    __extends(ChordDiagramDataItem, _super);
    /**
     * Constructor
     */
    function ChordDiagramDataItem() {
        var _this = _super.call(this) || this;
        _this.className = "ChordDiagramDataItem";
        _this.applyTheme();
        return _this;
    }
    return ChordDiagramDataItem;
}(FlowDiagramDataItem));
export { ChordDiagramDataItem };
/**
 * ============================================================================
 * MAIN CLASS
 * ============================================================================
 * @hidden
 */
/**
 * Creates a Pie chart
 * @see {@link IChordDiagramEvents} for a list of available Events
 * @see {@link IChordDiagramAdapters} for a list of available Adapters
 * @important
 */
var ChordDiagram = /** @class */ (function (_super) {
    __extends(ChordDiagram, _super);
    /**
     * Constructor
     */
    function ChordDiagram() {
        var _this = 
        // Init
        _super.call(this) || this;
        /**
         * A list of chart's Chord nodes.
         *
         * @param {DictionaryTemplate<string, ChordNode>}
         */
        _this.nodes = new DictionaryTemplate(new ChordNode());
        /**
         * A list of Chord links connecting nodes.
         *
         * @param {ListTemplate<ChordLink>}
         */
        _this.links = new ListTemplate(new ChordLink());
        /**
         * [valueAngle description]
         *
         * @ignore Exclude from docs
         * @todo Description
         * @type {number}
         */
        _this.valueAngle = 0;
        _this.className = "ChordDiagram";
        _this.startAngle = -90;
        _this.endAngle = 270;
        _this.radius = percent(80);
        _this.innerRadius = -15;
        _this.nodePadding = 5;
        var chordContainer = _this.chartContainer.createChild(Container);
        chordContainer.align = "center";
        chordContainer.valign = "middle";
        chordContainer.shouldClone = false;
        _this.chordContainer = chordContainer;
        _this.nodesContainer.parent = chordContainer;
        _this.linksContainer.parent = chordContainer;
        // Apply theme
        _this.applyTheme();
        return _this;
    }
    /**
     * Updates a cummulative value of the node.
     *
     * A node's value is determined by summing values of all of the incoming
     * links or all of the outgoing links, whichever results in bigger number.
     *
     * @param {FlowDiagramNode}  node  Node value
     */
    ChordDiagram.prototype.getNodeValue = function (node) {
        var sum = 0;
        $iter.each(node.incomingDataItems.iterator(), function (dataItem) {
            sum += dataItem.getWorkingValue("value");
        });
        $iter.each(node.outgoingDataItems.iterator(), function (dataItem) {
            sum += dataItem.getWorkingValue("value");
        });
        node.value = sum;
        this.fixMin(node);
    };
    ;
    /**
     * Redraws the chart.
     *
     * @ignore Exclude from docs
     */
    ChordDiagram.prototype.validate = function () {
        var _this = this;
        _super.prototype.validate.call(this);
        var chartContainer = this.chartContainer;
        var nodesContainer = this.nodesContainer;
        var radius = $utils.relativeRadiusToValue(this.radius, $math.min(chartContainer.innerWidth, chartContainer.innerHeight)) / 2;
        var pixelInnerRadius = $utils.relativeRadiusToValue(this.innerRadius, radius, true);
        var endAngle = this.endAngle;
        var startAngle = this.startAngle + this.nodePadding / 2;
        var rect = $math.getArcRect(this.startAngle, this.endAngle, 1);
        var total = 0;
        var count = 0;
        $iter.each(this._sorted, function (strNode) {
            var node = strNode[1];
            _this.getNodeValue(node);
            total += node.value;
            count++;
        });
        this.valueAngle = (endAngle - this.startAngle - this.nodePadding * count) / total;
        $iter.each(this._sorted, function (strNode) {
            var node = strNode[1];
            var slice = node.slice;
            node.parent = nodesContainer;
            slice.radius = radius;
            slice.innerRadius = pixelInnerRadius;
            var arc;
            if (_this.nonRibbon) {
                arc = (endAngle - _this.startAngle) / count - _this.nodePadding;
            }
            else {
                arc = _this.valueAngle * node.value;
            }
            slice.arc = arc;
            slice.startAngle = startAngle;
            node.trueStartAngle = startAngle;
            node.invalidate();
            startAngle += arc + _this.nodePadding;
        });
        this.chordContainer.definedBBox = { x: radius * rect.x, y: radius * rect.y, width: radius * rect.width, height: radius * rect.height };
        this.chordContainer.invalidateLayout();
    };
    /**
     * [appear description]
     *
     * @ignore Exclude from docs
     * @todo Description
     */
    ChordDiagram.prototype.appear = function () {
        _super.prototype.appear.call(this);
        /* quite useless - in case sequencedInterpolation = false, the animation is not visible, as the proportions
           are the same. if true, then it doesn't look right either.
        let duration = this.interpolationDuration;
        let i = 0;
        this.dataItems.each((dataItem) => {
            let delay = 0;
            if (this.sequencedInterpolation) {
                delay = this.sequencedInterpolationDelay * i + duration * i / $iter.length(this.nodes.iterator());
            }

            dataItem.setWorkingValue("value", 0.001, 0);
            dataItem.setWorkingValue("value", dataItem.value, duration, delay);
            i++;
        })*/
    };
    /**
     * Sets defaults that instantiate some objects that rely on parent, so they
     * cannot be set in constructor.
     */
    ChordDiagram.prototype.applyInternalDefaults = function () {
        _super.prototype.applyInternalDefaults.call(this);
        // Add a default screen reader title for accessibility
        // This will be overridden in screen reader if there are any `titles` set
        if (!$type.hasValue(this.readerTitle)) {
            this.readerTitle = this.language.translate("Chord diagram");
        }
    };
    /**
     * Creates and returns a new data item.
     *
     * @return {this} Data item
     */
    ChordDiagram.prototype.createDataItem = function () {
        return new ChordDiagramDataItem();
    };
    Object.defineProperty(ChordDiagram.prototype, "startAngle", {
        /**
         * @return {number} Start angle (degrees)
         */
        get: function () {
            return this.getPropertyValue("startAngle");
        },
        /**
         * Starting angle of the Radar face. (degrees)
         *
         * Normally, a circular radar face begins (the radial axis is drawn) at the
         * top center. (at -90 degrees)
         *
         * You can use `startAngle` to change this setting.
         *
         * E.g. setting this to 0 will make the radial axis start horizontally to
         * the right, as opposed to vertical.
         *
         * For a perfect circle the absolute sum of `startAngle` and `endAngle`
         * needs to be 360.
         *
         * However, it's **not** necessary to do so. You can set those to lesser
         * numbers, to create semi-circles.
         *
         * E.g. `startAngle = -90` with `endAngle = 0` will create a radar face that
         * looks like a quarter of a circle.
         *
         * @default -90
         * @param {number}  value  Start angle (degrees)
         */
        set: function (value) {
            this.setPropertyValue("startAngle", value, true);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChordDiagram.prototype, "endAngle", {
        /**
         * @return {number} End angle (degrees)
         */
        get: function () {
            return this.getPropertyValue("endAngle");
        },
        /**
         * Starting angle of the Radar face. (degrees)
         *
         * Normally, a circular radar face ends (the radial axis is drawn) exactly
         * where it has started, forming a full 360 circle. (at 270 degrees)
         *
         * You can use `endAngle` to end the circle somewhere else.
         *
         * E.g. setting this to 180 will make the radar face end at horizontal line
         * to the left off the center.
         *
         * For a perfect circle the absolute sum of `startAngle` and `endAngle`
         * needs to be 360.
         *
         * However, it's **not** necessary to do so. You can set those to lesser
         * numbers, to create semi-circles.
         *
         * E.g. `startAngle = -90` with `endAngle = 0` will create a radar face that
         * looks like a quarter of a circle.
         *
         * @default -90
         * @param {number}  value  End angle (degrees)
         */
        set: function (value) {
            this.setPropertyValue("endAngle", value, true);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChordDiagram.prototype, "radius", {
        /**
         * @return {number} Outer radius
         */
        get: function () {
            return this.getPropertyValue("radius");
        },
        /**
         * Outer radius of the Radar face.
         *
         * This can either be in absolute pixel value, or relative [[Percent]].
         *
         * @param {number | Percent}  value  Outer radius
         */
        set: function (value) {
            this.setPropertyValue("radius", value, true);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChordDiagram.prototype, "innerRadius", {
        /**
         * @return {number} Inner radius
         */
        get: function () {
            return this.getPropertyValue("innerRadius");
        },
        /**
         * Inner radius of the Chord nodes.
         *
         * This can either be in absolute pixel value, or relative [[Percent]].
         *
         * @param {number | Percent}  value  Outer radius
         */
        set: function (value) {
            this.setPropertyValue("innerRadius", value, true);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChordDiagram.prototype, "nonRibbon", {
        /**
         * @return {boolean} Non-ribbon
         */
        get: function () {
            return this.getPropertyValue("nonRibbon");
        },
        /**
         *
         * If you set this to true, all the lines will be of the same width. This is done by making middleLine of a ChordLink visible.
         *
         * @param {boolean}  value
         */
        set: function (value) {
            this.setPropertyValue("nonRibbon", value, true);
            this.links.template.middleLine.strokeOpacity = 1;
            this.links.template.link.fillOpacity = 0;
        },
        enumerable: true,
        configurable: true
    });
    return ChordDiagram;
}(FlowDiagram));
export { ChordDiagram };
/**
 * Register class in system, so that it can be instantiated using its name from
 * anywhere.
 *
 * @ignore
 */
registry.registeredClasses["ChordDiagram"] = ChordDiagram;
//# sourceMappingURL=ChordDiagram.js.map