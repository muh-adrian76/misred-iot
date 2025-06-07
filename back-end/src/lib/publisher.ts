import { connect } from 'mqtt';

const client = connect(process.env.RABBITMQ_URL_MQTT!);

// Testing publisher MQTT
client.on("connect", () => {
    client.publish("device/data", JSON.stringify({
        device_id: 2,
        ph: 7.0,
        cod: 12.5,
        tss: 45,
        nh3n: 0.8,
        flow: 120
    }));
    console.log("✅ Pesan telah di-publish.");
    client.end();
})