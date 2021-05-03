
/*
 hicbit_control package
*/
//% weight=10 icon="\uf2c5" color=#7CCD7C
namespace hicbit_control {

    export let sn: number = 0;
    export let NEW_LINE = "\r\n";
    export let Init_flag: number = 0xFF;
    export let Port_A: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    export let Port_B: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    export let Port_C: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    export let Port_D: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    export enum hicbit_key {
        //% block="up"
        up = 0x01,
        //% block="down"
        down = 0x02,
        //% block="left"
        left = 0x03,
        //% block="right"
        right = 0x04
    }
    
    /**
     * hicbit initialization, please execute at boot time
    */
    //% weight=100 blockGap=20 blockId=hicbit_Init block="Initialize hicbit"
    export function hicbit_Init() {

        led.enable(false);

        serial.redirect(
            SerialPin.P8,
            SerialPin.P12,
            BaudRate.BaudRate115200);

        basic.forever(() => {
            getHandleCmd();
        });

        while (Init_flag > 0) {
            if (Init_flag > 0) {    //查询命令
                QueryCMD();
            }
            basic.pause(2000);
        }

        basic.pause(1000);
    }

     
    /**
    * Get the handle command.
    */
    function getHandleCmd() {
        let flag: number = -1; 
        let j: number = 0; 
        let handleCmd: string = serial.readString();
        serial.writeString(handleCmd);
        if (handleCmd.charAt(0).compare("F") == 0) {
            if (handleCmd.charAt(1).compare("C") == 0)
                if (handleCmd.charAt(2).compare("F") == 0)
                    if (handleCmd.charAt(3).compare("C") == 0)
                        flag = 1;
        }
        if (flag != -1) {
            let index = strToNumber(handleCmd.substr(4, 2));        //Get the length
            let cmd: string = handleCmd.substr(0, index * 2 + 6);   //Get all fields
            for (let i = 0; i < index * 2 + 4; i += 2) {
                j = j + strToNumber(cmd.substr(i, 2));              
            }
            if (strToNumber(cmd.substr(index * 2 + 4, 2)) == (j & 0xFF) && j != 0) {
                //serial.writeString("Ture");
                let cmd_code = strToNumber(handleCmd.substr(8, 2));     //cmd_code
                let flag_code = strToNumber(handleCmd.substr(10, 2));    //flag/Numbering
                if (cmd_code == 0x02) {
                    Init_flag=flag_code;
                }
                if (cmd_code == 0xC1) {
                    let value1 = strToNumber(handleCmd.substr(14, 2));      //value1
                    let value2 = strToNumber(handleCmd.substr(16, 2))*10;      //value2(Y轴数值*10)
                    let value3 = strToNumber(handleCmd.substr(18, 2))*10;      //value3(Z轴数值*10)
                    if (flag_code == 8 || flag_code == 9)
                        value1 = value1 * 10;       //(X轴数值*10/距离*10)
                    switch (strToNumber(handleCmd.substr(12, 2)))    //Port_num
                    {
                        case 1:
                            Port_A[flag_code] = value1;
                            Port_A[10] = value2;
                            Port_A[11] = value3;
                            break;
                        case 2:
                            Port_B[flag_code] = value1;
                            Port_B[10] = value2;
                            Port_B[11] = value3;
                            break;
                        case 3:
                            Port_C[flag_code] = value1;
                            Port_C[10] = value2;
                            Port_C[11] = value3;
                            break;
                        case 4:
                            Port_D[flag_code] = value1;
                            Port_D[10] = value2;
                            Port_D[11] = value3;
                            break;
                    }
                }
                
            }
            else if (strToNumber(cmd.substr(index * 2 + 4, 2)) != (j & 0xFF) && j!= 0) {
                //serial.writeString("Flase");
            }
        }

        handleCmd = "";
    }

    function findIndexof(src: string, strFind: string, startIndex: number): number {
        for (let i = startIndex; i < src.length; i++) {
            if (src.charAt(i).compare(strFind) == 0) {
                return i;
            }
        }
        return -1;
    }
    
    function strToNumber(str: string): number {
        let num: number = 0;
        for (let i = 0; i < str.length; i++) {
            let tmp: number = converOneChar(str.charAt(i));
            if (tmp == -1)
                return -1;
            if (i > 0)
                num *= 16;
            num += tmp;
        }
        return num;
    }

    function converOneChar(str: string): number {
        if (str.compare("0") >= 0 && str.compare("9") <= 0) {
            return parseInt(str);
        }
        else if (str.compare("A") >= 0 && str.compare("F") <= 0) {
            if (str.compare("A") == 0) {
                return 10;
            }
            else if (str.compare("B") == 0) {
                return 11;
            }
            else if (str.compare("C") == 0) {
                return 12;
            }
            else if (str.compare("D") == 0) {
                return 13;
            }
            else if (str.compare("E") == 0) {
                return 14;
            }
            else if (str.compare("F") == 0) {
                return 15;
            }
            return -1;
        }
        else
            return -1;
    }

    /**
    * Query command.
    */
    function QueryCMD() {
        let Check_Digit: number = 0;
        let buf = pins.createBuffer(7);

        buf[0] = 0xFE;
        buf[1] = 0xFE;
        buf[2] = 0x04;        //长度
        buf[3] = hicbit_control.getsncode();//sn码
        buf[4] = 0x01;                      //CMD
        buf[5] = 0x00;
        for (let i = 0; i < 6; i++)
            Check_Digit = Check_Digit + buf[i];
        buf[6] = Check_Digit & 0xFF;       //校验
        serial.writeBuffer(buf);
    }

    /**
    * Get message increment code(sn).
    */
   export function getsncode() {
        if (sn >= 0xff)
            sn = 0;
        return sn++;
    }

    /**
     * Pause for the specified time in seconds
     * @param s how long to pause for, eg: 1, 2, 5, 10, 20,
     */
    //% weight=90
    //% block="wait(s) %s"
    //% blockId=wait_s
    export function wait_s(s:number) {
        basic.pause(s*1000);
    }

    /**
     * Pause for the specified time in milliseconds
     * @param ms how long to pause for, eg: 100, 200, 500
     */
    //% weight=89
    //% block="wait(ms) %ms"
    //% blockId=wait_ms
    export function wait_ms(ms:number) {
        basic.pause(ms);
    }

}



/*
 hicbit package
*/
//% weight=9 icon="\uf180" color=#5F9EA0
namespace hicbit {

    export let NEW_LINE = "\r\n";

    export enum hicbit_Port {
        //% block="port A"
        port1 = 0x01,
        //% block="port B"
        port2 = 0x02,
        //% block="port C"
        port3 = 0x03,
        //% block="Port D"
        port4 = 0x04
    }

    export enum hicbit_Features {
        //% block="start_up"
        start_up = 0x01,
        //% block="stop"
        stop = 0x02,
        //% block="time(s)"
        time = 0x03,
        //% block="number_of_turns"
        number_of_turns = 0x04,
        //% block="angle"
        angle = 0x05,
        
    }

    export enum hicbit_Coded_motor_Port {
        //% block="port A"
        port1 = 0x01,
        //% block="port B"
        port2 = 0x02,
        //% block="port C"
        port3 = 0x03,
        //% block="port D"
        port4 = 0x04,
    }

    export enum Coded_motor_speed {
        //% block="fast"
        fast = 0xff,
        //% block="Medium"
        Medium = 0x80,
        //% block="slow"
        slow = 0x40,
    }

    /**
    *	Set interface motor speed , range of -255~255, that can control turn.etc.
    */
    //% weight=99 blockId=hicbit_set_Single_motor block="Set |port %port| motor|speed %speed| |Features %Features|: |%content|"
    //% speed.min=-255 speed.max=255 
    //% inlineInputMode=inline
    export function hicbit_set_Single_motor(port: hicbit_Port, speed: number, Features: hicbit_Features, content: number) {
        //校验
        let Check_Digit: number = 0;

        //启动变量
        let Turn: number = 0;
        let buf = pins.createBuffer(10);

        //时间变量
        let time2: number = 0;

        //角度变量
        let angle: number = 0 ;     //角度
        let buf2 = pins.createBuffer(13);

        //圈数变量
        let num_of_turn: number = 0 ;

        if (speed > 255 || speed < -255) {
            return;
        }
        
        Turn = (speed > 0 ? 1 : 2);                 //方向

        if (Features == 1||Features == 3)                   //启动
        {
            buf[0] = 0xFE;
            buf[1] = 0xFE;
            buf[2] = 0x07;        //长度
            buf[3] = hicbit_control.getsncode();//sn码
            buf[4] = 0xA1;                      //CMD
            buf[5] = Turn;                       
            buf[6] = 0x00;
            buf[7] = speed;
            buf[8] = port;
            for (let i = 0; i < 9; i++)
                Check_Digit = Check_Digit + buf[i];
            buf[9] = Check_Digit & 0xFF;       //校验
            serial.writeBuffer(buf);

            if (Features == 3)          //时间
            { 
                Check_Digit = 0;
                time2 = content * 1000;
                basic.pause(time2);
                
                buf[0] = 0xFE;
                buf[1] = 0xFE;
                buf[2] = 0x07;    
                buf[3] = hicbit_control.getsncode();
                buf[4] = 0xA2;              
                buf[5] = 0x00;                       
                buf[6] = 0x00;
                buf[7] = 0x00;
                buf[8] = port;
                for (let i = 0; i < 9; i++)
                    Check_Digit = Check_Digit + buf[i];
                buf[9] = Check_Digit & 0xFF;       //校验
                serial.writeBuffer(buf);

            }
        }

        if(Features == 2)                   //停止
        { 

            buf[0] = 0xFE;
            buf[1] = 0xFE;
            buf[2] = 0x07;    
            buf[3] = hicbit_control.getsncode();
            buf[4] = 0xA2;                      
            buf[5] = 0x00;                       
            buf[6] = 0x00;
            buf[7] = 0x00;
            buf[8] = port;
            for (let i = 0; i < 9; i++)
                Check_Digit = Check_Digit + buf[i];
            buf[9] = Check_Digit & 0xFF;       //校验
            serial.writeBuffer(buf);
            
        }

        if (Features == 4)                       //圈数
        {
            num_of_turn = content;

            if (num_of_turn > 0xff || num_of_turn < 0)
                num_of_turn = 0;

            buf2[0] = 0xFE;
            buf2[1] = 0xFE;
            buf2[2] = 0x0A;      
            buf2[3] = hicbit_control.getsncode();
            buf2[4] = 0xA3;                      
            buf2[5] = 0x00;                       
            buf2[6] = 0x00;
            buf2[7] = Turn;
            buf2[8] = port;
            buf2[9] = num_of_turn;
            buf2[10] = speed;
            buf2[11] = 1;            //0：绝对位置 1：相对位置
            for (let i = 0; i < 12; i++)
                Check_Digit = Check_Digit + buf2[i];
            buf2[12] = Check_Digit & 0xFF;       //校验
            serial.writeBuffer(buf2);
        
        }

        if (Features == 5)                   //角度
        {
            angle = content;

            buf2[0] = 0xFE;
            buf2[1] = 0xFE;
            buf2[2] = 0x0A;      
            buf2[3] = hicbit_control.getsncode();
            buf2[4] = 0xA4;                      
            buf2[5] = (angle & 0xFF00) >> 8;                       
            buf2[6] = (angle & 0xFF);
            buf2[7] = Turn;
            buf2[8] = port;
            buf2[9] = 0x00;
            buf2[10] = speed;
            buf2[11] = 1;            //0：绝对位置 1：相对位置
            for (let i = 0; i < 12; i++)
                Check_Digit = Check_Digit + buf2[i];
            buf2[12] = Check_Digit & 0xFF;       //校验
            serial.writeBuffer(buf2);
        }

    }

    /**
    *	Set interface motor1 and motor2 speed , range of -255~255, that can control turn.etc.
    *   @param port1 First port, eg: hicbit.hicbit_Port.port1
    *   @param port2 The second port, eg: hicbit.hicbit_Port.port2
    */
    //% weight=98 blockId=hicbit_set_Dual_motor block="Set |port %port1| motor |speed %speed1| and |port %port2| motor |speed %speed2| |Features %Features|: |%content|"
    //% speed1.min=-255 speed1.max=255 
    //% speed2.min=-255 speed2.max=255 
    //% inlineInputMode=inline
    export function hicbit_set_Dual_motor(port1: hicbit_Port, speed1: number,port2: hicbit_Port, speed2: number, Features: hicbit_Features, content: number) {
        //校验
        let Check_Digit: number = 0;
        
        //启动变量
        let Turn1: number = 0;
        let Turn2: number = 0;
        let buf = pins.createBuffer(12);
        
        //时间变量
        let time2: number = 0;
        let buf2 = pins.createBuffer(10);

        //角度变量
        let angle: number = 0 ;     //角度值
        let buf3 = pins.createBuffer(15);

        //圈数变量
        let num_of_turn: number = 0 ;
        
        if (speed1 > 255 || speed1 < -255) 
            return;
        if (speed2 > 255 || speed2 < -255)
            return;
        
        Turn1 = (speed1 > 0 ? 1 : 2);                 //方向1
        Turn2 = (speed2 > 0 ? 1 : 2);                 //方向2

        if (Features == 1||Features == 3)                   //启动
        {
            buf[0] = 0xFE;
            buf[1] = 0xFE;
            buf[2] = 0x09;        //长度
            buf[3] = hicbit_control.getsncode();//sn码
            buf[4] = 0xB1;                      //CMD
            buf[5] = Turn1;                       
            buf[6] = port1;
            buf[7] = speed1;
            buf[8] = Turn2;
            buf[9] = port2;
            buf[10] = speed2;
            for (let i = 0; i < 11; i++)
                Check_Digit = Check_Digit + buf[i];
            buf[11] = Check_Digit & 0xFF;       //校验
            serial.writeBuffer(buf);

            if (Features == 3)          //时间
            { 
                Check_Digit = 0;
                time2 = content * 1000;
                basic.pause(time2);
                
                buf2[0] = 0xFE;
                buf2[1] = 0xFE;
                buf2[2] = 0x07;        //长度
                buf2[3] = hicbit_control.getsncode();//sn码
                buf2[4] = 0xB2;                      //CMD
                buf2[5] = 0x00;
                buf2[6] = 0x00;
                buf2[7] = port1;
                buf2[8] = port2;
                for (let i = 0; i < 9; i++)
                    Check_Digit = Check_Digit + buf2[i];
                buf2[9] = Check_Digit & 0xFF;       //校验
                serial.writeBuffer(buf2);

            }
        }
        
        if (Features == 2)                   //停止
        {
            buf2[0] = 0xFE;
            buf2[1] = 0xFE;
            buf2[2] = 0x07;        //长度
            buf2[3] = hicbit_control.getsncode();//sn码
            buf2[4] = 0xB2;                      //CMD
            buf2[5] = 0x00;
            buf2[6] = 0x00;
            buf2[7] = port1;
            buf2[8] = port2;
            for (let i = 0; i < 9; i++)
                Check_Digit = Check_Digit + buf2[i];
            buf2[9] = Check_Digit & 0xFF;       //校验
            serial.writeBuffer(buf2);
        }

        if (Features == 4)                       //圈数
        {
            num_of_turn = content;

            if (num_of_turn > 0xff || num_of_turn < 0)
                num_of_turn = 0;

            buf3[0] = 0xFE;
            buf3[1] = 0xFE;
            buf3[2] = 0x0d;        //长度
            buf3[3] = hicbit_control.getsncode();//sn码
            buf3[4] = 0xB3;                      //CMD
            buf3[5] = 0x00;
            buf3[6] = 0x00;
            buf3[7] = Turn1;
            buf3[8] = port1;
            buf3[9] = speed1;
            buf3[10] = Turn2;
            buf3[11] = port2;
            buf3[12] = speed2;
            buf3[13] = num_of_turn;
            buf3[14] = 1;            //0：绝对位置 1：相对位置
            for (let i = 0; i < 14; i++)
                Check_Digit = Check_Digit + buf3[i];
            buf3[14] = Check_Digit & 0xFF;       //校验
            serial.writeBuffer(buf3);
        }

        if (Features == 5)                   //角度
        {
            angle = content;

            if (angle > 360 || angle < 0)
                angle = 0;

            buf3[0] = 0xFE;
            buf3[1] = 0xFE;
            buf3[2] = 0x0d;        //长度
            buf3[3] = hicbit_control.getsncode();//sn码
            buf3[4] = 0xB4;                      //CMD
            buf3[5] = (angle & 0xFF00) >> 8;                       
            buf3[6] = (angle & 0xFF);
            buf3[7] = Turn1;
            buf3[8] = port1;
            buf3[9] = speed1;
            buf3[10] = Turn2;
            buf3[11] = port2;
            buf3[12] = speed2;
            buf3[13] = 0x00;
            buf3[14] = 1;            //0：绝对位置 1：相对位置
            for (let i = 0; i < 15; i++)
                Check_Digit = Check_Digit + buf3[i];
            buf3[15] = Check_Digit & 0xFF;       //校验
            serial.writeBuffer(buf3);
        }

    }

    /**
    *	Set Coded motor , angle of -360~360, that can control turn.
    */
    //% weight=97 blockId=hicbit_setCodedmotor block="Set |port %port| motor|angle %angle|and |speed %speed|"
    //% angle.min=-360 angle.max=360
    //% speed.min=0 speed.max=255
    export function hicbit_setCodedmotor(port: hicbit_Coded_motor_Port,angle: number,speed:Coded_motor_speed) {
        //校验
        let Check_Digit: number = 0;
        let Turn: number = 0;    
        let buf = pins.createBuffer(13);

        if (angle > 360 || angle < 0)
            angle = 0;

        Turn = (angle > 0 ? 1 : 2);                 //方向

        buf[0] = 0xFE;
        buf[1] = 0xFE;
        buf[2] = 0x0A;      
        buf[3] = hicbit_control.getsncode();
        buf[4] = 0xC1;                      
        buf[5] = (angle & 0xFF00) >> 8;                       
        buf[6] = (angle & 0xFF);
        buf[7] = Turn;
        buf[8] = port;
        buf[9] = 0x00;
        buf[10] = speed;
        buf[11] = 0;            //0：绝对位置 1：相对位置
        for (let i = 0; i < 12; i++)
            Check_Digit = Check_Digit + buf[i];
        buf[12] = Check_Digit & 0xFF;       //校验
        serial.writeBuffer(buf);

    }

}

/*
 Sensor package
*/
//% weight=8 icon="\uf2db" color=#8470FF
namespace Sensor {
    
    export enum hicbit_Port {
        //% block="port 1"
        port1 = 0x01,
        //% block="port 2"
        port2 = 0x02,
        //% block="port 3"
        port3 = 0x03,
        //% block="Port 4"
        port4 = 0x04
    }

    export enum Sensor_type {
        //% block="getphotosensitive"
        photosensitive = 0x01,
        //% block="collisionsensor"
        collisionsensor = 0x02,
        //% block="avoidSensor"
        avoidSensor = 0x03,
        //% block="ColorSensor"
        ColorSensor = 0x04,
        //% block="Soundsensor"
        Soundsensor = 0x05,
        //% block="Temperature_and_humidity_sensor"
        Temperature_and_humidity_sensor = 0x06,
        //% block="lineSensor"
        lineSensor = 0x07,
        //% block="ultrasonic"
        ultrasonic = 0x08,
        //% block="GyroscopGe_X"
        GyroscopGe_X = 0x09,
        //% block="GyroscopGe_Y"
        GyroscopGe_Y = 0x10,
        //% block="GyroscopGe_Z"
        GyroscopGe_Z = 0x11,
    }

    /**
     * Initialize the sensor
     */
    //% weight=99 blockId=SensorInit block="Initialize %port | %sensor"
    export function SensorInit(port: hicbit_Port,sensor:Sensor_type):void{
        let Check_Digit: number = 0;
        let buf = pins.createBuffer(8);

        buf[0] = 0xFE;
        buf[1] = 0xFE;
        buf[2] = 0x05;        //长度
        buf[3] = hicbit_control.getsncode();//sn码
        buf[4] = 0xC0;                      //CMD
        buf[5] = sensor;
        buf[6] = port;
        for (let i = 0; i < 7; i++)
            Check_Digit = Check_Digit + buf[i];
        buf[7] = Check_Digit & 0xFF;       //校验
        serial.writeBuffer(buf);

        basic.pause(500);
    }

    /**
     * Get the value of a sensor on a port
     */
    //% weight=98 blockId=GetSensorValue block="Get %port | %sensor "
    export function GetSensorValue(port: hicbit_Port,sensor:Sensor_type): number {
        let Check_Digit: number = 0;
        let sersor_value: number = 0;
        let buf = pins.createBuffer(8);

        buf[0] = 0xFE;
        buf[1] = 0xFE;
        buf[2] = 0x05;        //长度
        buf[3] = hicbit_control.getsncode();//sn码
        buf[4] = 0xC1;                      //CMD
        buf[5] = sensor;
        buf[6] = port;
        for (let i = 0; i < 7; i++)
            Check_Digit = Check_Digit + buf[i];
        buf[7] = Check_Digit & 0xFF;       //校验
        serial.writeBuffer(buf);

        basic.pause(500);

        switch (port)    //Port_num
        {
            case 1:
                sersor_value = hicbit_control.Port_A[sensor];
                break;
            case 2:
                sersor_value = hicbit_control.Port_B[sensor];
                break;
            case 3:
                sersor_value = hicbit_control.Port_C[sensor];
                break;
            case 4:
                sersor_value = hicbit_control.Port_D[sensor];
                break;
        }

        return sersor_value;
    }

}

/**
 * RGB light
 */
//% color=#CD9B9B weight=6
//% icon="\uf0eb"
namespace RGB_light {

    export enum hicbit_Port {
        //% block="port A"
        port1 = 0x01,
        //% block="port B"
        port2 = 0x02,
        //% block="port C"
        port3 = 0x03,
        //% block="Port D"
        port4 = 0x04
    }

    let lhRGBLight: hicbitRGBLight.LHhicbitRGBLight;
    /**
	 * Initialize Light belt
	 */
    //% weight=100 blockId=hicbit_initRGBLight block="Initialize light belt at port %port"
    export function hicbit_initRGBLight(port: hicbit_Port) {
        switch (port) {
            case hicbit_Port.port1:
                if (!lhRGBLight) {
                    lhRGBLight = hicbitRGBLight.create(DigitalPin.P15, 3, hicbitRGBPixelMode.RGB);
                }
                break;
            case hicbit_Port.port2:
                if (!lhRGBLight) {
                    lhRGBLight = hicbitRGBLight.create(DigitalPin.P13, 3, hicbitRGBPixelMode.RGB);
                }
                break;
            case hicbit_Port.port3:
                if (!lhRGBLight) {
                    lhRGBLight = hicbitRGBLight.create(DigitalPin.P14, 3, hicbitRGBPixelMode.RGB);
                }
                break;
            case hicbit_Port.port4:
                if (!lhRGBLight) {
                    lhRGBLight = hicbitRGBLight.create(DigitalPin.P10, 3, hicbitRGBPixelMode.RGB);
                }
                break;
        }
        lhRGBLight.clear();
    }
    
    /**
	 * Set RGB
	 */
    //% weight=99 blockId=hicbit_setPixelRGB block="Set light belt at|%lightoffset|color to |red %red|and|green %green|and|blue %blue|"
    //% inlineInputMode=inline
    //% red.min=0 red.max=255
    //% green.min=0 green.max=255
    //% blue.min=0 blue.max=255
    export function hicbit_setPixelRGB(lightoffset: hicbitLight, red: number, green: number, blue: number) {
        if (lightoffset == lhRGBLight._length)//全部
        {
            for (let i = 0; i < lhRGBLight._length; i++)
            {
                lhRGBLight.RGB(i, red, green, blue);     
            }
        }
        else
        {
            lhRGBLight.RGB(lightoffset, red, green, blue); 
        }
    }

    /**
     * Display the colored lights, and set the color of the colored lights to match the use. After setting the color of the colored lights, the color of the lights must be displayed.
     */
    //% weight=98 blockId=hicbit_showLight block="Show light belt"
    export function hicbit_showLight() {
        lhRGBLight.show();
    }

    /**
     * Clear the color of the colored lights and turn off the lights.
     */
    //% weight=97 blockGap=20 blockId=hicbit_clearLight block="Clear light"
    export function hicbit_clearLight() {
        lhRGBLight.clear();
    }
    
}


/*
 Display package
*/
//% weight=5 icon="\uf108" color=#6E8B3D
namespace Display {

    export let NEW_LINE = "\r\n";

    export enum Linenum {
        //% block="first_line"
        first_line = 0x01,
        //% block="second_line"
        second_line = 0x02,
        //% block="Third_line"
        Third_line = 0x03,
        //% block="Fourth_line"
        Fourth_line = 0x04,
        //% block="Fifth_line"
        Fifth_line = 0x05,
        
    }

    export enum Sensornum {
        //% block="Sound_sensor"
        Sound_sensor = 0x01,
        //% block="Tracking_sensor"
        Tracking_sensor = 0x02,
        //% block="Accelerating_gyroscope"
        Accelerating_gyroscope = 0x03,
        //% block="Color_sensor"
        Color_sensor = 0x04,
    }
    
    /**
        * Display Init
        */
    //% weight=100 blockId=DisplayInit block="Display Init"
    export function DisplayInit(): void {
        let Check_Digit: number = 0;
        let buf = pins.createBuffer(7);

        buf[0] = 0xFE;
        buf[1] = 0xFE;
        buf[2] = 0x04;        //长度
        buf[3] = hicbit_control.getsncode();//sn码
        buf[4] = 0xB0;                      //CMD
        buf[5] = 0x00;
        for (let i = 0; i < 6; i++)
            Check_Digit = Check_Digit + buf[i];
        buf[6] = Check_Digit & 0xFF;       //校验
        serial.writeBuffer(buf);

        basic.pause(500);
       
    }

    /**
        * Any value displayed on the screen
        */
    //% weight=99 blockId=setDisplay2 block="Display %line |text: %text "
    export function setDisplay2(line: Linenum, text: string): void {
        let num: number = 1;
        let Check_Digit: number = 0;
        let buf = pins.createBuffer(6);
        let buf1 = pins.createBuffer(1);
        switch (line) {
            case Linenum.first_line:
                num = 1;
                break;
            case Linenum.second_line:
                num = 2;
                break;
            case Linenum.Third_line:
                num = 3;
                break;
            case Linenum.Fourth_line:
                num = 4;
                break;
            case Linenum.Fifth_line:
                num = 5;
                break;
        }
        buf[0] = 0xFE;
        buf[1] = 0xFE;
        buf[2] = 0x04 + text.length;        //长度
        buf[3] = hicbit_control.getsncode();//sn码
        buf[4] = 0xB1;                      //CMD
        buf[5] = num;                       //行数
        serial.writeBuffer(buf);
        serial.writeString(text);           //内容
        for (let i = 0; i < buf.length; i++)
            Check_Digit = Check_Digit + buf[i];
        for (let i = 0; i < text.length; i++)
            Check_Digit = Check_Digit + text.charCodeAt(i);
        buf1[0] = Check_Digit & 0xFF;       //校验
        serial.writeBuffer(buf1);
        //serial.writeString(NEW_LINE);

        basic.pause(500);
    }



    /**
        * Display clear
        */
    //% weight=98 blockId=Clearscreen block="Clear screen"
    export function Clearscreen(): void {
        let Check_Digit: number = 0;
        let buf = pins.createBuffer(7);

        buf[0] = 0xFE;
        buf[1] = 0xFE;
        buf[2] = 0x04;        //长度
        buf[3] = hicbit_control.getsncode();//sn码
        buf[4] = 0xB2;                      //CMD
        buf[5] = 0x00;
        for (let i = 0; i < 6; i++)
            Check_Digit = Check_Digit + buf[i];
        buf[6] = Check_Digit & 0xFF;       //校验
        serial.writeBuffer(buf);
       
        basic.pause(500);
    }


    /**
        * Display exit
        */
    //% weight=97 blockId=exitscreen block="Display exit screen"
    export function exitscreen(): void {
        let Check_Digit: number = 0;
        let buf = pins.createBuffer(7);

        buf[0] = 0xFE;
        buf[1] = 0xFE;
        buf[2] = 0x04;        //长度
        buf[3] = hicbit_control.getsncode();//sn码
        buf[4] = 0xB3;                      //CMD
        buf[5] = 0x00;
        for (let i = 0; i < 6; i++)
            Check_Digit = Check_Digit + buf[i];
        buf[6] = Check_Digit & 0xFF;       //校验
        serial.writeBuffer(buf);

        basic.pause(500);
       
    }


    /**
        * The screen displays the value of the sensor
        */
    //% weight=96 blockId=DisplaysersorValue block="Display %port | %sensor "
    export function DisplaysersorValue(port: Sensor.hicbit_Port ,sensor:Sensor.Sensor_type): void {
        let Check_Digit: number = 0;
        let buf = pins.createBuffer(8);
        
        buf[0] = 0xFE;
        buf[1] = 0xFE;
        buf[2] = 0x05;        //长度
        buf[3] = hicbit_control.getsncode();//sn码
        buf[4] = 0xB4;                      //CMD
        buf[5] = sensor;                       //类型
        buf[6] = port;
        for (let i = 0; i < 7; i++)
            Check_Digit = Check_Digit + buf[i];
        buf[7] = Check_Digit & 0xFF;       //校验
        serial.writeBuffer(buf);
        //serial.writeString(NEW_LINE);

        basic.pause(500);
    }
}
