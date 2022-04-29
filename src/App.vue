<template>
  <div id="app">
    <div class="box">
      <my-marker></my-marker>
    </div>
  </div>
</template>
<script>
import Marker from './views/Marker.vue'
export default {
  components: {
    MyMarker: Marker,
  },
}
</script>

<style scoped>
.box {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
