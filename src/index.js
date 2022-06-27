import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from "joi";

dotenv.config();

const cliente = new MongoClient(URL_CONNECT_MONGO);
let db;

cliente.connect().then(() => {
    db = cliente.db("uol");
});

const server = express();

server.use(express.json());
server.use(cors());

server.post("/participants", async (req, res) => {
    const userSchema = joi.object({
        name: joi.string().required()
    });
    const { name } = req.body;
    const validation = userSchema.validate(user, { abortEarly: true });
    if (validation.error) {
        res.sendStatus(422);
        return;
    }
    const nameExists = await db.collection("participantes").findOne({ name: name });
    if (nameExists !== null) {
        res.sendStatus(409);
        return;
    } else {
        await db.collection("participantes").insertOne({ name, lastStatus: Date.now() });
        await db.collection("mensagens").insertOne({ from: name, to: "Todos", text: "entra na sala...", type: "status", time: dayjs().format("HH:mm:ss") });
        res.sendStatus(201);
    }
});

server.get("/participants", async(req, res) => {
    const allParticipants = await db.collection("participantes").find({}).toArray();
    res.send(allParticipants);
})

server.post("/messages", async(req, res) => {
    const messageSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: 
    })
    const { to, text, type } = req.body;
    const user = req.headers.user;
    await db.collection("mensagens").insertOne({ from: user, to, text, type, time: dayjs().format("HH:mm:ss")});
    res.sendStatus(201);
});

server.get("/messages", async(req, res) => {
    const messages = await db.collection("mensagens").find({}).toArray();
    const user = req.headers.user;
    const limit = parseInt(req.query.limit);
    const mensagensParaEnviar = [];
    let tamanho = messages.length - 1;

    while (mensagensParaEnviar.length < limit) {
        let elemento = messages[tamanho];
        if (elemento.type === "private_message") {
            if ((elemento.to === user) || (elemento.from === user)) {
                mensagensParaEnviar = [ elemento, ...mensagensParaEnviar];
            };
        } else {
            mensagensParaEnviar = [ elemento, ...mensagensParaEnviar];
        };
        tamanho--;
    };
    res.send(mensagensParaEnviar);
});

server.post("/status", )


// Remove usuários inativos
setInterval(async() => {
    const now = Date.now() - 10000;
    const users = await db.collection("participantes").find({ lastStatus: { $lt: now} }).toArray();
    users.forEach(async(element) => {
        await db.collection("mensagens").insertOne({ from: element.name, to: "Todos", text: "sai da sala...", type: "status", time: dayjs().format("HH:mm:ss") });
    });
    await db.collection("participantes").deleteMany({ lastStatus: { $lt: now} });
    console.log("Usuários inativos removidos");
},15000);

server.listen(5000, () => {console.log("Servidor rodando!")});