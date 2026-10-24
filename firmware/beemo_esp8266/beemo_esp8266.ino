// BeeMo sensor kit firmware for NodeMCU ESP8266.
// Reads a DHT22 (temperature, humidity) and an HX711 load cell (weight), posts a
// reading every minute, and drives the heater/cooler from local thresholds so the
// hive stays regulated even when Wi-Fi is down.
//
// Libraries: ESP8266WiFi, ESP8266HTTPClient (ESP8266 core), DHT sensor library, HX711 (bogde).

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include <HX711.h>

// ---- Configure these ----
const char* WIFI_SSID = "your-wifi";
const char* WIFI_PASSWORD = "your-password";
const char* INGEST_URL = "https://your-beemo-domain/api/ingest";
const char* DEVICE_KEY = "bm_paste_the_key_from_device_settings";
const float LOAD_CELL_CALIBRATION = 2280.0;  // from your calibration run
const float EMPTY_BOX_KG = 1.0;               // weight of the empty hive box

// ---- Pins ----
const uint8_t DHT_PIN = D4;
const uint8_t HX711_DOUT = D5;
const uint8_t HX711_SCK = D6;
const uint8_t HEATER_PIN = D1;
const uint8_t COOLER_PIN = D2;

const float TEMP_MIN = 32.0;
const float TEMP_MAX = 35.0;
const unsigned long REPORT_EVERY_MS = 60000;

DHT dht(DHT_PIN, DHT22);
HX711 scale;
unsigned long lastReport = 0;

void regulate(float temperature) {
  // Local control: works with or without the server.
  digitalWrite(HEATER_PIN, temperature < TEMP_MIN ? HIGH : LOW);
  digitalWrite(COOLER_PIN, temperature > TEMP_MAX ? HIGH : LOW);
}

void report(float temperature, float humidity, float weightKg) {
  if (WiFi.status() != WL_CONNECTED) return;

  WiFiClientSecure client;
  client.setInsecure();  // for production, pin the server certificate with setFingerprint()
  HTTPClient http;
  if (!http.begin(client, INGEST_URL)) return;

  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + DEVICE_KEY);
  String body = String("{\"temperature\":") + String(temperature, 1) +
                ",\"humidity\":" + String(humidity, 1) +
                ",\"weight\":" + String(weightKg, 2) + "}";

  int code = http.POST(body);
  Serial.printf("POST %d %s\n", code, http.getString().c_str());
  http.end();
}

void setup() {
  Serial.begin(115200);
  pinMode(HEATER_PIN, OUTPUT);
  pinMode(COOLER_PIN, OUTPUT);
  dht.begin();
  scale.begin(HX711_DOUT, HX711_SCK);
  scale.set_scale(LOAD_CELL_CALIBRATION);
  scale.tare();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);  // reconnects automatically
}

void loop() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  if (isnan(temperature) || isnan(humidity)) {
    delay(2000);
    return;
  }
  regulate(temperature);

  if (millis() - lastReport >= REPORT_EVERY_MS) {
    lastReport = millis();
    float weightKg = max(0.0f, scale.get_units(10) / 1000.0f - EMPTY_BOX_KG);
    report(temperature, humidity, weightKg);
  }
  delay(2000);
}
