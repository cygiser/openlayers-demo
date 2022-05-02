import { Point, Polygon, LineString, LinearRing, Circle } from 'ol/geom'
import { fromCircle } from 'ol/geom/Polygon'
import { fromLonLat } from 'ol/proj'
import { Fill, Icon, Stroke, Style, Text } from 'ol/style'
//星型
let starFunction = function (coordinates, geometry) {
  //中心点
  var center = coordinates[0]
  //鼠标点击的另一个点
  var last = coordinates[1]
  var dx = center[0] - last[0]
  var dy = center[1] - last[1]
  //半径
  var radius = Math.sqrt(dx * dx + dy * dy)
  //旋转的角度
  var rotation = Math.atan2(dy, dx)
  //用来记录顶点坐标的数组
  var newCoordinates = []
  //顶点个数
  var numPoints = 12
  for (var i = 0; i < numPoints; ++i) {
    //顶点相对转过的角度
    var angle = rotation + (i * 2 * Math.PI) / numPoints
    //确定凸顶点和凹顶点
    var fraction = i % 2 === 0 ? 1 : 0.58
    //计算顶点的坐标
    var offsetX = radius * fraction * Math.cos(angle)
    var offsetY = radius * fraction * Math.sin(angle)
    newCoordinates.push([center[0] + offsetX, center[1] + offsetY])
  }
  newCoordinates.push(newCoordinates[0].slice())
  if (!geometry) {
    geometry = new Polygon([newCoordinates])
  } else {
    geometry.setCoordinates([newCoordinates])
  }
  return geometry
}

//细直箭头
let arrowFunction = (feature) => {
  let geometry = feature.getGeometry()
  let styles = [
    new Style({
      stroke: new Stroke({
        color: 'black',
        width: 3,
      }),
    }),
  ]
  //获取线段端点的坐标
  let points = geometry.flatCoordinates
  //计算线段的角度
  let dx = points[2] - points[0]
  let dy = points[3] - points[1]
  let rotation = Math.atan2(dy, dx)
  //箭头(三角形)
  /* const head = new RegularShape({
    points: 3,
    radius: 5,
    fill: new Fill({
      color: 'black',
    }),
    rotateWithView: true,
    rotation: -rotation,
  }) */
  styles.push(
    new Style({
      geometry: new Point([points[2], points[3]]), //最后一个点
      image: new Icon({
        src: require('../assets/arrow.jpg'),
        anchor: [0.75, 0.5],
        rotateWithView: true,
        rotation: -rotation,
      }),
    })
  )
  return styles
}
//定位标记
let locFunction = (feature) => {
  let geometry = feature.getGeometry()
  let point = geometry.flatCoordinates
  let style = new Style({
    geometry: new Point(point),
    image: new Icon({
      src: require('../assets/loc.jpg'),
      anchor: [0.75, 0.5],
    }),
  })
  return style
}
// 单曲箭头
//阶乘
function factorial(num) {
  if (num <= 1) {
    return 1
  } else {
    return num * factorial(num - 1)
  }
}
/*
 * 生成贝塞尔曲线插值点
 * @para n {number} 控制点数量
 * @para arrPoints {array} 控制点坐标集合
 */
function createBezierCurvePoints(n, arrPoints) {
  var Ptx = 0
  var Pty = 0

  var arrbline = []
  for (var t = 0; t < 1; t = t + 0.01) {
    Ptx = 0
    Pty = 0
    for (var i = 0; i <= n; i++) {
      Ptx += (factorial(n) / (factorial(i) * factorial(n - i))) * Math.pow(1 - t, n - i) * Math.pow(t, i) * arrPoints[i][0]
      Pty += (factorial(n) / (factorial(i) * factorial(n - i))) * Math.pow(1 - t, n - i) * Math.pow(t, i) * arrPoints[i][1]
    }

    arrbline.push([Ptx, Pty])
  }
  return arrbline
}
let singleArrowFunction = (coordinates, geometry) => {
  let BezierLine = createBezierCurvePoints(coordinates.length - 1, coordinates)
  if (!geometry) {
    geometry = new LineString(BezierLine)
  } else {
    geometry.setCoordinates(BezierLine)
  }
  return geometry
}
//单曲箭头的样式
let singleArrowStyle = (feature) => {
  let coors = feature.getGeometry().getCoordinates()
  let points = []
  points.push(coors[coors.length - 2])
  points.push(coors[coors.length - 1])
  let dx = points[1][0] - points[0][0]
  let dy = points[1][1] - points[0][1]
  let rotation = Math.atan2(dy, dx)
  let styles = [
    new Style({
      stroke: new Stroke({
        color: 'black',
        width: 3,
      }),
    }),
  ]
  styles.push(
    new Style({
      geometry: new Point(points[1]),
      image: new Icon({
        src: require('../assets/arrow.jpg'),
        anchor: [0.75, 0.5],
        rotation: -rotation,
      }),
    })
  )
  return styles
}
//文本标记
let textLabel = new Style({
  text: new Text({
    textAlign: 'center',
    textBaseline: 'middle',
    text: '请输入文字内容',
    //字体样式
    //font: 'normal 14px 微软雅黑',
  }),
})
//椭圆
function genEllipseGeom(radiusMajor, radiusMinor, center, rotation) {
  var circle = new Circle(center, radiusMinor)
  var polygon = fromCircle(circle, 64)
  polygon.scale(radiusMajor / radiusMinor, 1)
  polygon.rotate(rotation, center)
  return polygon
}
let EllipseFunction = (coordinates, geometry) => {
  let cArray = coordinates[0]
  let center = cArray[0]
  let startPoint = cArray[1]
  let endPoint = cArray[2]
  if (!geometry) {
    geometry = new Polygon([])
  }
  if (cArray.length == 3) {
    let coordinatesRing = cArray.slice()
    coordinatesRing.push(center)
    let plg = new Polygon([coordinatesRing])
    let plygArea = plg.getArea()
    let radiusMajor = Math.sqrt(Math.pow(center[0] - startPoint[0], 2) + Math.pow(center[1] - startPoint[1], 2))
    let radiusMinor = (plygArea * 2) / radiusMajor
    let dx = startPoint[0] - center[0]
    let dy = startPoint[1] - center[1]
    let rotation = Math.atan(dx / dy)
    rotation = dy > 0 ? -rotation - Math.PI * 0.5 : -(Math.PI * 0.5 + rotation)
    let f = genEllipseGeom(radiusMajor, radiusMinor, center, rotation)
    geometry.setCoordinates(f.getCoordinates())
  }
  return geometry
}
//扇形
//参数分别是圆心，半径，边数，弧度，旋转角度（即右边半径与x正向轴的角度）
function getSector(origin, radius, sides, r, angel) {
  /* var rotation = 360 - r
  var angle = Math.PI * (1 / sides - 1 / 2)
  if (rotation) {
    angle += (rotation / 180) * Math.PI
  } */
  var rotatedAngle, x, y
  var points = []
  for (var i = 0; i < sides; ++i) {
    var an = (i * r) / sides
    rotatedAngle = angel + an
    x = origin[0] + radius * Math.cos(rotatedAngle)
    y = origin[1] + radius * Math.sin(rotatedAngle)
    /* if (i === 0 || i === 1) {
      console.log(new Point([x, y]))
    } */
    points.push([x, y])
  }
  points.push(origin)
  var ring = new LinearRing([points])
  console.log(ring)
  ring.rotate(r + angel, origin)
  return new Polygon([points])
}
let SectorFunction = (coordinates, geometry) => {
  let cArray = coordinates[0]
  let origin = cArray[0]
  let startPoint = cArray[1]
  let endPoint = cArray[2]
  if (!geometry) {
    geometry = new Polygon([])
  }
  if (cArray.length === 3) {
    let dx = startPoint[0] - origin[0]
    let dy = startPoint[1] - origin[1]
    let radius = Math.sqrt(dx * dx + dy * dy)
    let sides = 100
    let angel = Math.atan2(dy, dx)
    let angel2 = Math.atan2(endPoint[1] - origin[1], endPoint[0] - origin[0])
    let r = angel2 - angel
    let s = getSector(origin, radius, sides, r, angel)
    //console.log(s)
    geometry.setCoordinates(s.getCoordinates())
  }
  return geometry
}
export { starFunction, arrowFunction, locFunction, singleArrowFunction, singleArrowStyle, textLabel, EllipseFunction, SectorFunction }
