<template>
  <div id="mymap" style="width: 1500px; height: 800px">
    <div class="popup" ref="popup" v-show="ifShow">
      <el-link icon="el-icon-delete" type="danger" :underline="false" @click.native="handleDelete">删除该标记</el-link>
    </div>
    <div class="select">
      <el-button type="danger" @click="deleteAll">删除所有标记</el-button>
      <el-dropdown @command=" handleCommand">
        <el-button type=" plain">
          添加标记<i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="Point">点</el-dropdown-item>
          <el-dropdown-item command="LineString">线</el-dropdown-item>
          <el-dropdown-item command="Polygon">多边形</el-dropdown-item>
          <el-dropdown-item command="Circle">圆</el-dropdown-item>
          <el-dropdown-item command="Box">矩形</el-dropdown-item>
          <el-dropdown-item command="Square">方形</el-dropdown-item>
          <el-dropdown-item command="Star">星型</el-dropdown-item>
          <el-dropdown-item command="Arrow">细直箭头</el-dropdown-item>
          <el-dropdown-item command="singleArrow">单曲箭头</el-dropdown-item>
          <el-dropdown-item command="Loc">定位标记</el-dropdown-item>
          <el-dropdown-item command="Text">文本标记</el-dropdown-item>
          <el-dropdown-item command="out">退出添加</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { Map, View } from 'ol'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { XYZ, Vector as VectorSource } from 'ol/source'
import * as olProj from 'ol/proj'
import Draw, { createRegularPolygon } from 'ol/interaction/Draw'
import Overlay from 'ol/Overlay'
import { createBox } from 'ol/interaction/Draw'
import { starFunction, arrowFunction, locFunction, singleArrowFunction, singleArrowStyle, textLabel } from '../utils/geometryFunction.js'
export default {
  data() {
    return {
      map: null,
      markerSource: null,
      markerLayer: null,
      draw: null,
      overlay: null,
      ifShow: false, //控制弹窗是否显示
      feature: null,
    }
  },
  methods: {
    init_map() {
      //底图
      let baseLayer = new TileLayer({
        source: new XYZ({
          url: 'https://wprd0{1-4}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&style=7&x={x}&y={y}&z={z}',
        }),
      })
      //标记图层源
      this.markerSource = new VectorSource({
        wrapX: false,
      })
      //标记图层
      this.markerLayer = new VectorLayer({
        source: this.markerSource,
        style: this.styles,
      })
      //地图
      this.map = new Map({
        target: 'mymap',
        layers: [baseLayer, this.markerLayer],
        view: new View({
          zoom: 7,
          center: olProj.fromLonLat([116, 32]),
        }),
      })
    },
    //添加标记
    handleCommand(command) {
      //先清除之前的draw
      if (this.draw) this.map.removeInteraction(this.draw)
      //this.markerLayer.setStyle() //默认样式
      //画相应的图形
      //如果画点、线、多边形、圆,则指定type就行
      let op_types1 = ['Point', 'LineString', 'Polygon', 'Circle']
      if (op_types1.includes(command)) {
        this.draw = new Draw({
          source: this.markerSource,
          type: command,
          stopClick: true, //绘制时禁用鼠标事件
        })
      } else if (command === 'Box') {
        this.draw = new Draw({
          source: this.markerSource,
          type: 'Circle',
          geometryFunction: createBox(),
          stopClick: true,
        }) //矩形
      } else if (command === 'Square') {
        this.draw = new Draw({
          source: this.markerSource,
          type: 'Circle',
          geometryFunction: createRegularPolygon(4),
          stopClick: true,
        }) //方形
      } else if (command === 'Star') {
        this.draw = new Draw({
          source: this.markerSource,
          type: 'Circle',
          geometryFunction: starFunction,
          stopClick: true,
        }) //星型
      } else if (command === 'Arrow') {
        this.draw = new Draw({
          source: this.markerSource,
          type: 'LineString',
          stopClick: true,
          maxPoints: 2,
          style: arrowFunction,
        }) //细直箭头
        this.draw.on('drawend', (e) => {
          e.feature.setStyle(arrowFunction)
        })
      } else if (command === 'Loc') {
        this.draw = new Draw({
          source: this.markerSource,
          type: 'Point',
          stopClick: true,
          style: locFunction,
        }) //定位标记
        this.draw.on('drawend', (e) => {
          e.feature.setStyle(locFunction)
        })
      } else if (command === 'singleArrow') {
        this.draw = new Draw({
          source: this.markerSource,
          type: 'LineString',
          stopClick: true,
          geometryFunction: singleArrowFunction,
          style: singleArrowStyle,
        }) //单曲箭头
        this.draw.on('drawend', (e) => {
          e.feature.setStyle(singleArrowStyle)
        })
      } else if (command === 'Text') {
        this.draw = new Draw({
          source: this.markerSource,
          type: 'Point',
          stopClick: true,
        })
        this.draw.on('drawend', (e) => {
          let feature = e.feature
          feature.setStyle(textLabel)
          feature.getStyle().getText().setText('curry')
        })
      }
      //如果画其他图形，需设置geometryFunction
      //添加标记到地图
      this.map.addInteraction(this.draw)
      //退出添加
      if (command === 'out') this.map.removeInteraction(this.draw)
    },
    //添加弹窗的方法
    addPopup() {
      //获取弹窗元素
      let elPopup = this.$refs.popup
      //创建Overlay
      this.overlay = new Overlay({
        element: elPopup, //HTML元素
        offset: [100, -20], //
        positioning: 'bottom-center',
        stopEvent: false, //让overlay和map放在不同的html容器内
      })
    },
    //鼠标单击事件
    sigleClick() {
      this.map.on('singleclick', (e) => {
        //获取点击的标注
        this.feature = this.map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
          return feature
        })
        //如果点击到标记
        if (this.feature) {
          this.ifShow = true //弹窗显示
          //设置弹窗的位置
          this.overlay.setPosition([this.feature.values_.geometry.flatCoordinates[0], this.feature.values_.geometry.flatCoordinates[1]])
          this.map.addOverlay(this.overlay)
        } else {
          this.ifShow = false
        }
      })
    },
    //删除选中标记
    handleDelete() {
      this.markerSource.removeFeature(this.feature)
    },
    //删除图层中所有标记
    deleteAll() {
      //遍历图层中所有标记，依次删除
      this.markerSource.forEachFeature((feature) => {
        this.markerSource.removeFeature(feature)
      })
    },
  },
  mounted() {
    this.init_map()
    this.addPopup()
    this.sigleClick()
  },
}
</script>

<style scoped>
#mymap {
  position: relative;
}
.select {
  position: absolute;
  z-index: 99;
  right: 0;
  bottom: 20px;
}
.popup {
  width: 120px;
  height: 20px;
}
</style>
