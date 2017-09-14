var x = navigator.bluetooth.requestDevice({
  filters: [{ services: [0xffe5] }]
});
