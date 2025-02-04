#include <ESP8266WiFi.h>
#include <FirebaseClient.h>
#include <WiFiClientSecure.h>
#include <WiFiManager.h>

#define RELAY_PIN 5
#define WIFI_SSID "AbisoIVC"
#define WIFI_PASSWORD "12345678"
#define DATABASE_SECRET "VmZ9VmJ1ZNPhgwzk9BidIk6IrHsdyiWynFAf5HQY"
#define DATABASE_URL "https://abiso-ivc-default-rtdb.firebaseio.com/"

void asyncCB(AsyncResult &aResult);

WiFiClientSecure ssl_client;
DefaultNetwork network;
AsyncClientClass aClient(ssl_client, getNetwork(network));
FirebaseApp app;
RealtimeDatabase Database;
AsyncResult result;
LegacyToken dbSecret(DATABASE_SECRET);
WiFiManager wifiManager;

bool alarmState = false;

void setup() {
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  Serial.begin(115200);

  Serial.print("Connecting to Wi-Fi");
  if (!wifiManager.autoConnect("ESP8266_AP")) {
    Serial.println("Failed to connect, restarting...");
    delay(3000);
    ESP.restart();
  }
  Serial.println("\nConnected with IP:");
  Serial.println(WiFi.localIP());
  Serial.println();

  ssl_client.setInsecure();
#if defined(ESP8266)
  ssl_client.setBufferSizes(1024, 1024);
#endif

  initializeApp(aClient, app, getAuth(dbSecret), asyncCB, "authTask");
  app.getApp<RealtimeDatabase>(Database);
  Database.url(DATABASE_URL);

  Serial.print("Setting initial state to false... ");
  bool status = Database.set<bool>(aClient, "/alarm/ivc", false);
  if (status) {
    Serial.println("OK");
  } else {
    Serial.println("Failed");
  }
}

void loop() {
  app.loop();
  Database.loop();

  if (WiFi.status() == WL_CONNECTED) {

  } else {

  }

  static unsigned long lastCheckTime = 0;
  const unsigned long checkInterval = 5000;
  if (millis() - lastCheckTime >= checkInterval && app.ready()) {
    lastCheckTime = millis();
    Database.get(aClient, "/alarm/ivc", asyncCB, false, "getPeriodicUpdate");
  }

  static unsigned long alarmStartTime = 0;
  const unsigned long alarmDuration = 30000;
  if (alarmState) {
    if (alarmStartTime == 0) {
      alarmStartTime = millis();
    } else {
      digitalWrite(RELAY_PIN, HIGH);
      if (millis() - alarmStartTime >= alarmDuration) {
        digitalWrite(RELAY_PIN, LOW);
        alarmState = false;
        alarmStartTime = 0;
        Serial.println("Alarm state set to false after 30 seconds.");
        Database.set<bool>(aClient, "/alarm/ivc", alarmState);
      }
    }
  } else {
    digitalWrite(RELAY_PIN, LOW);
    alarmStartTime = 0;
    Serial.println("Alarm state forced to false");
  }
}

void asyncCB(AsyncResult &aResult) {
  if (aResult.isError()) {
    Serial.print("ERROR GETTING BOOL VALUE IN DATABASE");
  } else if (aResult.available()) {
    if (aResult.uid() == "getInitialState" || aResult.uid() == "getPeriodicUpdate") {
      String result = aResult.c_str();
      if (result == "true") {
        alarmState = true;
      } else {
        alarmState = false;
      }
    }
  }
}
