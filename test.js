'use strict';
        document.addEventListener('WebComponentsReady', () => {
            let connectToggle = document.querySelector('#connect');
            let progress = document.querySelector('#progress');
            let dialog = document.querySelector('#errorDialog');
            let gattServer;
            let commandService;
            let writeClientReqCharacteristic;
            let writeClientEvtCharacteristic;
            let busy = false;
            let commandQueue = [];

            let drive = 0;
            let action = 0;

            progress.hidden = true;

            /**
             * Check if browser supports Web Bluetooth API.
             */
            if (navigator.bluetooth == undefined) {
                document.getElementById("no-bluetooth").style.display = "block";
                document.getElementById("no-bluetooth").open();
            }



            function initEvent() {
                let cmdPinAd = new Uint16Array([0x22B8, 0x00]);
                sendEvent(cmdPinAd).then(() => {
                    console.log('Event set.');
                }).catch(handleError);
            }

            function sendEvent(cmd) {
                if (writeClientReqCharacteristic) {
                    // Handle one command at a time
                    if (busy) {
                        // Queue commands
                        commandQueueP.push(cmd);
                        return Promise.resolve();
                    }
                    busy = true;
                    return writeClientReqCharacteristic.writeValue(cmd).then(() => {
                        busy = false;
                        // Get next command from queue
                        let nextCommand = commandQueue.shift();
                        if (nextCommand) {
                            sendEvent(nextCommand);
                        }
                    });
                } else {
                    return Promise.resolve();
                }
            }

            function moveBuggy(stick) {
                let heading = stick.angle;
                let distance = stick.distance;
                if (distance < 15) {
                    buggyStop();
                    return;
                } else if ((heading >= 300) || (heading <= 60)) {
                    buggyForward();
                } else if (heading <= 120) {
                    buggyRight();
                } else if (heading <= 230) {
                    buggyBackwards();
                } else {
                    buggyLeft();
                }
            }

            function buggyStop() {
                if (action == 0) {
                    return;
                }
                drive = 0;
                action = 0;
                console.log('buggyStop');
                sendCommand(new Uint16Array([0x22B8, 1000]));
            }

            function buggyForward() {
                if (action == 1) {
                    return;
                }
                action = 1;
                drive = 1;
                console.log('buggyForward');
                sendCommand(new Uint16Array([0x22B8, 1001]));
            }

            function buggyBackwards() {
                if (action == 2) {
                    return;
                }
                action = 2;
                drive = 2;
                console.log('buggyBackwards');
                sendCommand(new Uint16Array([0x22B8, 1002]));
            }

            function buggyLeft() {
                if (action == 3) {
                    return;
                }
                action = 3;
                console.log('buggyLeft');
                sendCommand(new Uint16Array([0x22B8, 1003]));
            }

            function buggyRight() {
                if (action == 4) {
                    return;
                }
                action = 4;
                console.log('buggyRight');
                sendCommand(new Uint16Array([0x22B8, 1004]));
            }

            /**
             * Reset the app variable states.
             */
            function resetVariables() {
                busy = false;
                progress.hidden = true;
                gattServer = null;
                commandService = null;
                writeClientReqCharacteristic = null;
                writeClientEvtCharacteristic = null;
                connectToggle.checked = false;

            }

            /**
             * API error handler.
             */
            function handleError(error) {
                console.log(error);
                resetVariables();
                dialog.open();
            }

        
            function sendCommand(cmd) {
                if (writeClientEvtCharacteristic) {
                    // Handle one command at a time
                    if (busy) {
                        // Queue commands
                        commandQueue.push(cmd);
                        return Promise.resolve();
                    }
                    busy = true;


                    return writeClientEvtCharacteristic.writeValue(cmd).then(() => {
                        busy = false;
                        // Get next command from queue
                        let nextCommand = commandQueue.shift();
                        if (nextCommand) {
                            sendCommand(nextCommand);
                        }
                    });


                } else {
                    return Promise.resolve();
                }
            }

         

            function handleCharacteristicValueChanged(event) {
                var value = event.target.value;

                let a = [];
                // Convert raw data bytes to hex values just for the sake of showing something.
                // In the "real" world, you'd use data.getUint8, data.getUint16 or even
                // TextDecoder to process raw data bytes.
                for (let i = 0; i < value.byteLength; i++) {
                    a.push('0x' + ('00' + value.getUint8(i).toString(16)).slice(-2));
                }
                //console.log('> ' + a.join(' '));

            }


            /**
             * Connect to command characteristic.
             */
            connectToggle.addEventListener('click', () => {
                if (gattServer != null && gattServer.connected) {
                    if (gattServer.disconnect) {
                        console.log('Disconnecting...');
                        gattServer.disconnect();
                    }
                    resetVariables();
                } else {
                    console.log('Connecting...');
                    connectToggle.checked = true;
                    progress.hidden = false;
                    if (writeClientReqCharacteristic == null) {
                        navigator.bluetooth.requestDevice({
                                filters: [{
                                    namePrefix: 'BBC micro:bit',
                                }],
                                optionalServices: ['e95d93af-251d-470a-a062-fa1922dfa9a8'] //EVENTSERVICE_SERVICE_UUID
                            })
                            .then(device => {
                                console.log('Connecting to GATT Server...');
                                return device.gatt.connect();
                            })
                            .then(server => {
                                console.log('> Found GATT server');
                                gattServer = server;
                                //console.log(gattServer);
                                // Get command service
                                return gattServer.getPrimaryService('e95d93af-251d-470a-a062-fa1922dfa9a8'); //EVENTSERVICE_SERVICE_UUID
                            })
                            .then(service => {
                                console.log('> Found command service');
                                commandService = service;
                                return commandService.getCharacteristic('e95d9775-251d-470a-a062-fa1922dfa9a8'); //MICROBITEVENT_CHARACTERISTIC_UUID
                            })
                            .then(characteristic => {
                                console.log('> Found write characteristic');
                                                                
                                return characteristic.startNotifications().then(_ => {
                                  console.log('> Notifications started');
                                  characteristic.addEventListener('characteristicvaluechanged',
                                      handleCharacteristicValueChanged);
                                });
                            })
                            .then(service => {
                                return commandService.getCharacteristic('e95d5404-251d-470a-a062-fa1922dfa9a8'); //CLIENTEVENT_CHARACTERISTIC_UUID

                            })  
                            .then(ClientEvtCharacteristic => {
                                console.log('> Found Client Event ClientEvtCharacteristic');
                                writeClientEvtCharacteristic = ClientEvtCharacteristic;
                                return commandService.getCharacteristic('e95d23c4-251d-470a-a062-fa1922dfa9a8'); //CLIENTREQUIREMENTS_CHARACTERISTIC_UUID
                            })
                            .then(ClientReqCharacteristic => {
                                console.log('> Found Client Requirement characteristic');
                                writeClientReqCharacteristic = ClientReqCharacteristic;
                                initEvent();
                                progress.hidden = true;
                            })

                            .catch(handleError);
                    } else {
                        progress.hidden = true;
                    }
                }
            });

            let joystick = new RetroJoyStick({
                retroStickElement: document.querySelector('#retrostick')
            });
            joystick.subscribe('change', stick => {
                moveBuggy(stick);
            });


        });
