#include "MicroBit.h"
MicroBit uBit;

#define EVENT_ID		 8888
#define DC_FORWARD   1001
#define DC_BACKWARDS 1002
#define DC_LEFT 	 1003
#define DC_RIGHT 	 1004
#define DC_STOP 	 1000


void onConnected(MicroBitEvent) {
  //uBit.display.print("C");
}

 
void onDisconnected(MicroBitEvent){
  	// uBit.display.print("D");
	uBit.io.P8.setDigitalValue(0);
	uBit.io.P12.setDigitalValue(0);

	uBit.io.P16.setDigitalValue(0);
	uBit.io.P0.setDigitalValue(0);
}


void onControllerEvent(MicroBitEvent e) {
	if (e.value == DC_FORWARD) {
		uBit.io.P8.setDigitalValue(0);
		uBit.io.P12.setDigitalValue(0);

		uBit.io.P16.setDigitalValue(1);
		uBit.io.P0.setDigitalValue(0);
	}

	if (e.value == DC_BACKWARDS) {
		uBit.io.P8.setDigitalValue(0);
		uBit.io.P12.setDigitalValue(0);

		uBit.io.P16.setDigitalValue(0);
		uBit.io.P0.setDigitalValue(1);
	}

	if (e.value == DC_LEFT) {
		uBit.io.P8.setDigitalValue(0);
		uBit.io.P12.setDigitalValue(1);

		uBit.io.P16.setDigitalValue(1);
		uBit.io.P0.setDigitalValue(0);
	}

	if (e.value == DC_RIGHT) {
		uBit.io.P8.setDigitalValue(1);
		uBit.io.P12.setDigitalValue(0);

		uBit.io.P16.setDigitalValue(1);
		uBit.io.P0.setDigitalValue(0);

	}

	if (e.value == DC_STOP) {
		uBit.io.P8.setDigitalValue(0);
		uBit.io.P12.setDigitalValue(0);

		uBit.io.P16.setDigitalValue(0);
		uBit.io.P0.setDigitalValue(0);
	}

	
}

int main() {
    uBit.init();

    uBit.init();
	uBit.display.scroll("DC");
	uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_CONNECTED, onConnected);
	uBit.messageBus.listen(MICROBIT_ID_BLE, MICROBIT_BLE_EVT_DISCONNECTED, onDisconnected);
	uBit.messageBus.listen(EVENT_ID, 0, onControllerEvent);
	release_fiber();
}