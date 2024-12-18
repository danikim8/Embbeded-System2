'use strict';

$(document).ready(function () {
    var data = [];
    var queryCnt = 100; // 한 번에 가져올 데이터 개수
    var sensorData = {}; // 센서 데이터 저장 객체
    var res1 = []; // IR 데이터
    var res2 = []; // TILT 데이터
    var res3 = []; // Light 데이터
    const bulbElement = document.getElementById("bulb");
    const buzzerElement = document.getElementById("buzzer");
    const powerElement = document.getElementById("power");
    var options = {
        colors: ["#30323c"],
        series: {
            shadowSize: 0,
            lines: {
                show: true,
                fill: true,
                fillColor: {
                    colors: [{ opacity: 0.5 }, { opacity: 0.5 }]
                }
            }
        },
        yaxis: {
            min:0,
            max:1,
            ticks:[
                [0, "OFF"],
                [1, "ON"]
            ],        
            font: {
                color: "#68f350", // 틱 레이블 색상
                size: 16 // 폰트 크기
            }
        },
        xaxis: {
            show: false,
            min: 0,
            max: queryCnt
        },
        points: { show: true },
        grid: {
            backgroundColor: '#fff',
            borderWidth: 1,
            borderColor: '#fff',
            hoverable: true
        }
    };

    
    var plot1 = $.plot($("#realtime1"), [res1], options);

    
    var plot2 = $.plot($("#realtime2"), [res2], options);

    
    var plot3 = $.plot($("#realtime3"), [res3], options);

    
    function getData() {
        $.ajax({
            url: "/sensor/getSensor/" + queryCnt,
            type: "GET",
            dataType: "json",
            success: (res) => {
                data = res;

                
                res1 = [];
                res2 = [];
                res3 = [];

                for (var i = 0; i < data.length; ++i) {
                    var pairs = data[i]['value'];
                    var lis = pairs.split(",");
                    lis.forEach(pair => {
                        const [key, value] = pair.split(':');
                        sensorData[key.trim()] = parseFloat(value);
                    });

                    
                    res1.push([i, sensorData['IR']]);
                    res2.push([i, sensorData['Light']]);
                    res3.push([i, sensorData['TILT']]);
                }
                var LightValue = sensorData['Light'];
                var buttonValue = sensorData['But'];
                if((LightValue == 1) || (LightValue == 0 && buttonValue == 0)) {
                    bulbElement.className = "bulb-off"
                }
                else {
                    bulbElement.className = "bulb-on"
                }

                if(buttonValue == 1) {
                    powerElement.className = "power-off"
                }
                else{
                    powerElement.className = "power-on"
                }

                if(sensorData['IR'] == 1 || sensorData['TILT'] == 1) {
                    updateBuzzer(1)
                }else {
                    updateBuzzer(0)
                }
                // 차트 업데이트 함수 호출 (데이터를 받은 후에만 업데이트)
                updateCharts();
            },
            error: (error) => {
                console.log("데이터를 가져오는 중 오류 발생:", error);
                setTimeout(getData, updateInterval);
            }
        });
    }

    function updateSensorData() {
        $.ajax({
            url: "/sensor/get_sensor_data/",
            method: "GET",
            success: function(data) {
                let tableBody = $("table tbody");
                tableBody.empty();  // 기존 테이블 데이터 삭제
                
                // 새로운 데이터로 테이블 업데이트
                data.forEach(function(sensor) {
                    let status = sensor.value.split(", ");
                    // 상태에 따른 스타일 설정 함수
                function getStyle(status) {
                    return status === "ON" ? "color: #68f350;" : "color: rgb(207, 79, 79);";
                }
                    let newRow = `<tr>
                                    <td style="color : white;">${sensor.id}</td>
                                    <td style="${getStyle(status[0].includes("1") ? "ON" : "OFF")}">${status[0].includes("1") ? "ON" : "OFF"}</td> <!-- IR -->
                                    <td style="${getStyle(status[1].includes("1") ? "ON" : "OFF")}">${status[1].includes("1") ? "ON" : "OFF"}</td> <!-- Light -->
                                    <td style="${getStyle(status[2].includes("1") ? "ON" : "OFF")}">${status[2].includes("1") ? "ON" : "OFF"}</td> <!-- TILT -->
                                  </tr>`;                    
                    tableBody.append(newRow);
                });
                updateTables();
            },
            error: function(error) {
                console.log("Error:", error);
            }
        });
    }

    // 차트를 업데이트하는 함수
    function updateCharts() {
        // 각 차트에 데이터 설정 및 갱신
        plot1.setData([res1]);
        plot2.setData([res2]);
        plot3.setData([res3]);
        console.log(sensorData);
        plot1.draw();
        plot2.draw();
        plot3.draw();

        setTimeout(getData, updateInterval); // 일정 시간 후 다시 데이터를 가져옴
    }

    function updateTables() {
        // 각 차트에 데이터 설정 및 갱신
        setTimeout(updateSensorData, updateInterval); // 일정 시간 후 다시 데이터를 가져옴
    }

    function updateBuzzer(buzzervalue) {
        if (buzzervalue == 1) {
            buzzerElement.className = "buzzer-on"
        }else {
            buzzerElement.className = "buzzer-off"
        }
    }
    // 업데이트 간격 설정 및 시작
    var updateInterval = 1000; // 1초마다 업데이트

    // 첫 번째 호출로 데이터를 가져오기 시작
    getData();
    updateSensorData();
});