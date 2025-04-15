import { connect } from 'mqtt';

const client = connect(Bun.env.RABBITMQ_URL_MQTT!);

client.on("connect", () => {
    client.publish("device/data", JSON.stringify({
        device_id: 1,
        ph: 6.8,
        cod: 120,
        tss: 45,
        nh3_n: 0.5,
        flow: 100
    }));
    console.log("✅ Message published to MQTTBox via RabbitMQ.");
    client.end();
})

// async function publishMessage() {
//   try {
//     const connection = await connect(Bun.env.RABBITMQ_URL_AMQP!);
//     const channel = await connection.createChannel();

//     const exchange = "device_exchange";
//     const routingKey = "device/data";
    
//     const message = JSON.stringify({
//       device_id: 2,
//       ph: 8.0,
//       cod: 12.5,
//       tss: 45,
//       nh3n: 0.8,
//       flow: 120
//     });

//     await channel.assertExchange(exchange, "topic", { durable: false });
//     channel.publish(exchange, routingKey, Buffer.from(message));

//     console.log("Message published to RabbitMQ:", message);

//     setTimeout(() => {
//       connection.close();
//       process.exit(0);
//     }, 500);
//   } catch (error) {
//     console.error("Error publishing message:", error);
//   }
// }

// publishMessage();
