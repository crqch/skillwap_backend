import { User } from "@prisma/client";
import Elysia, { status, t } from "elysia";
import prisma from "../lib/prisma";

export default new Elysia({
    prefix: '/users'
})
    .get('/', async () => {
        // We do not want to return all of the user's data such as password
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                bio: true,
                receivedSwaps: true,
                sentSwaps: true,
                skills: true
            }
        });

        if (!users) {
            return status(400, "No users found!")
        }

        return { users }
    })
    .post("/", async ({ body: { name, email, password, bio, skills } }) => {
        const existingUser = await prisma.user.count({ where: { email } });
        if (existingUser > 0) return status(400, "This email is already taken!")
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password,
                bio: bio,
                skills: {

                    create: skills.map((skill) => ({
                        name: skill.name,
                        level: skill.level,
                    })),
                },
            },
            include: { skills: true },
        });

        return { message: "User created successfully", user }
    }, {
        body: t.Object({
            name: t.String(),
            email: t.String({ format: "email" }),
            password: t.String(),
            bio: t.Optional(t.String()),
            skills: t.Array(t.Object({
                name: t.String(),
                level: t.String()
            }))
        })
    })
    .group("/:userId", app =>
        app.derive(async ({ params: { userId } }): Promise<{
            paramUser: NonNullable<
                User
            >;
        }> => {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                throw status(404, "User not found!")
            };
            return { paramUser: user }
        })
            .derive(({ paramUser }) => {
                if (!paramUser) return status(404, "User not found!")
            })
            .get("/", async ({ paramUser }) => {
                return paramUser;
            })
            .patch("/", async ({ body: {
                name, email, password, bio, skills
            }, paramUser }) => {

                if (name) paramUser.name = name;
                if (email) paramUser.email = email;
                if (password) paramUser.password = password;
                if (bio) paramUser.bio = bio;

                paramUser = await prisma.user.update({
                    where: { id: paramUser.id },
                    data: {
                        ...paramUser,
                        skills: {
                            create: skills?.map((skill) => ({
                                name: skill.name,
                                level: skill.level,
                            })),
                        }
                    },
                    include: { skills: true }
                })

                return { message: "User updated successfully!", paramUser }
            }, {
                body: t.Object({
                    name: t.Optional(t.String()),
                    email: t.Optional(t.String({ format: "email" })),
                    password: t.Optional(t.String()),
                    bio: t.Optional(t.String()),
                    skills: t.Optional(t.Array(t.Object({
                        name: t.String(),
                        level: t.String()
                    })))
                })
            })
            .delete("/", async ({ paramUser }) => {
                await prisma.user.delete({ where: { id: paramUser.id } });
                return { message: "User deleted successfully!", paramUser }
            })
    )
