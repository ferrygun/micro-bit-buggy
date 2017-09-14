navigator.bluetooth.requestDevice({
  filters: [{
    namePrefix: 'BBC micro:bit',
  }],
  optionalServices: ['e95d93af-251d-470a-a062-fa1922dfa9a8'] //EVENTSERVICE_SERVICE_UUID
});
