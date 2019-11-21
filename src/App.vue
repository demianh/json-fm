<template>
  <div class="container-fluid">
    <MainTable></MainTable>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import MainTable from "@/components/MainTable.vue";

@Component({
  components: {
    MainTable,
  },
})
export default class App extends Vue {}
</script>

<style lang="scss">
input.form-control::-webkit-input-placeholder { /* Chrome/Opera/Safari */
  color: #ddd;
}
</style>
