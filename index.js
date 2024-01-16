const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;

let db;

try {
    db = mysql.createPool({
        host: "retirojoviada.mysql.uhserver.com",
        user: "guhzin",
        password: "gc5TKzR75KA!E9.",
        database: "retirojoviada",
    });

    db.getConnection((err, connection) => {
        if (err) {
            console.error('Erro na conexão com o banco de dados:', err);
        } else {
            console.log('Conexão bem-sucedida com o banco de dados!');
            connection.release();
        }
    });
} catch (error) {
    console.error('Erro ao criar pool de conexão:', error);
}

app.use(express.json());
app.use(cors());

app.post("/api/addleaders", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    db.query("SELECT *  FROM user WHERE email = ?", [email], (err, result) => {
        if (err) {
            res.send(err);
        }
        if (result.length == 0) {
            bcrypt.hash(password, saltRounds, (erro, hash) => {
                db.query("INSERT INTO user (name, email, password) VALUES (?, ?, ?)", [name, email, hash], (err, response) => {
                    if (err) {
                        res.send(err);
                    }
                    res.send({ msg: "cadastrado com sucesso!" });
                });
            })

        } else {
            res.send({ msg: "Usuario ja cadastrado!" });
        }
    })
})

app.delete("/api/deleteuser/:id", (req, res) => {
    const userId = req.params.id;
  
    db.query("DELETE FROM user WHERE id = ?", [userId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send({ msg: "Erro no servidor ao excluir usuário" });
      }
  
      if (result.affectedRows > 0) {
        return res.send({ msg: "Usuário excluído com sucesso!" });
      } else {
        return res.status(404).send({ msg: "Usuário não encontrado" });
      }
    });
  });

app.post("/api/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    db.query("SELECT * FROM user WHERE email = ?", [email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ msg: "Erro no servidor" });
        }

        if (result.length > 0) {
            bcrypt.compare(password, result[0].password, (erro, match) => {
                if (erro) {
                    console.error(erro);
                    return res.status(500).send({ msg: "Erro na comparação de senhas" });
                }

                if (match) {
                    const user = {
                        id: result[0].id,
                        name: result[0].name,
                        email: result[0].email,
                        // Adicione outros campos do usuário conforme necessário
                    };
                    return res.send({ msg: "Usuário logado!", user });
                } else {
                    return res.status(401).send({ msg: "Credenciais inválidas" });
                }
            });
        } else {
            return res.status(404).send({ msg: "Conta não encontrada" });
        }
    });
});

app.get("/api/users", (req, res) => {
    db.query("SELECT * FROM user", (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ msg: "Erro no servidor" });
        }

        return res.send(result);
    });
});

app.put("/api/edituser/:id", (req, res) => {
    const userId = req.params.id;
    const newName = req.body.name;
    const newEmail = req.body.email;
    const newPassword = req.body.password;

    // Adicione outras validações conforme necessário

    // Verifique se uma nova senha foi fornecida antes de gerar um novo hash
    if (newPassword) {
        bcrypt.hash(newPassword, saltRounds, (err, hash) => {
            if (err) {
                console.error(err);
                return res.status(500).send({ msg: "Erro ao gerar hash de senha" });
            }

            db.query(
                "UPDATE user SET name=?, email=?, password=? WHERE id=?",
                [newName, newEmail, hash, userId],
                (error, result) => {
                    if (error) {
                        console.error(error);
                        return res.status(500).send({ msg: "Erro na edição do usuário" });
                    }
                    return res.send({ msg: "Usuário editado com sucesso!" });
                }
            );
        });
    } else {
        // Se não houver nova senha, atualize sem gerar um novo hash
        db.query(
            "UPDATE user SET name=?, email=? WHERE id=?",
            [newName, newEmail, userId],
            (error, result) => {
                if (error) {
                    console.error(error);
                    return res.status(500).send({ msg: "Erro na edição do usuário" });
                }
                return res.send({ msg: "Usuário editado com sucesso!" });
            }
        );
    }
});

app.delete("/api/deleteparticipant/:id", (req, res) => {
    const participantId = req.params.id;

    db.query("DELETE FROM participantes WHERE id = ?", [participantId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ msg: "Erro no servidor ao excluir participante" });
        }

        if (result.affectedRows > 0) {
            return res.send({ msg: "Participante excluído com sucesso!" });
        } else {
            return res.status(404).send({ msg: "Participante não encontrado" });
        }
    });
});

app.get("/api/users/:id", (req, res) => {
    const userId = req.params.id;

    db.query("SELECT * FROM user WHERE id = ?", [userId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ msg: "Erro no servidor" });
        }

        if (result.length > 0) {
            const user = {
                id: result[0].id,
                name: result[0].name,
                email: result[0].email,
                // Add other user fields as needed
            };
            return res.send(user);
        } else {
            return res.status(404).send({ msg: "Usuário não encontrado" });
        }
    });
});

app.post('/api/addparticipantes', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const birthday = req.body.birthday;
    const phone = req.body.phone;

    try {
        const response = await new Promise((resolve, reject) => {
            db.query("INSERT INTO participantes (name, email, birthday, phone, status) VALUES (?, ?, ?, ?, 'pending')", [name, email, birthday, phone], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        res.send({ msg: "Cadastrado com sucesso!", insertedId: response.insertId });
    } catch (error) {
        console.error('Erro ao adicionar participante:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/addparticipant', async (req, res) => {
    const email = req.body.email;
    const name = req.body.name;
    const birthday = req.body.birthday;
    const phone = req.body.phone;
    const status = req.body.status;
    
    try {
        const response = await new Promise((resolve, reject) => {
            db.query("INSERT INTO participantes (name, email, birthday, phone, status) VALUES (?, ?, ?, ?, ?)", [name, email, birthday, phone, status], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        res.send({ msg: "Cadastrado com sucesso!", insertedId: response.insertId });
    } catch (error) {
        console.error('Erro ao adicionar participante:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.get("/api/participants", (req, res) => {
    db.query("SELECT * FROM participantes", (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ msg: "Erro no servidor" });
        }
        return res.send(result);
    });
});

app.get("/api/totalParticipants", (req, res) => {
    db.query("SELECT COUNT(*) as total FROM participantes", (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ msg: "Erro no servidor" });
        }
        return res.send({ total: result[0].total });
    });
});

app.get("/api/totalPaidParticipants", (req, res) => {
    db.query("SELECT COUNT(*) as totalPaid FROM participantes WHERE status = 'pay'", (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ msg: "Erro no servidor" });
        }
        return res.send({ totalPaid: result[0].totalPaid });
    });
});

app.get("/api/participants/:id", (req, res) => {
    const participantId = req.params.id;

    db.query("SELECT * FROM participantes WHERE id = ?", [participantId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send({ msg: "Erro no servidor" });
        }

        if (result.length > 0) {
            return res.send(result[0]);
        } else {
            return res.status(404).send({ msg: "Participante não encontrado" });
        }
    });
});

app.put("/api/editparticipant/:id", async (req, res) => {
    const participantId = req.params.id;
    const { name, email, birthday, phone, status } = req.body;

    try {
        const response = await new Promise((resolve, reject) => {
            // Atualize os campos conforme necessário, e adicione validações, se necessário
            db.query(
                "UPDATE participantes SET name=?, email=?, birthday=?, phone=?, status=? WHERE id=?",
                [name, email, birthday, phone, status, participantId],
                (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });

        res.send({ msg: "Participante editado com sucesso!" });
    } catch (error) {
        console.error('Erro ao editar participante:', error);
        res.status(500).json({ error: 'Erro interno do servidor ao editar participante' });
    }
});

process.on('uncaughtException', (error) => {
    console.error('Ocorreu um erro não tratado:', error);
  });

    app.listen(80, () => {
        console.log('Rodando na porta 80')
    })