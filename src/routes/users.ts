import { error } from "console";
import Elysia, { t } from "elysia";
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
            return error(400, "No users found!")
        }

        return { users }
    })
    .get("/:userId", async ({ params: { userId } }) => {
        const user = await prisma.user.findUnique({
            where: { id: userId }, select: {
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
        if (!user) {
            return error(404, "User not found!")
        }
        return user;
    }, {
        params: t.Object({
            userId: t.String()
        })
    })
    .post("/", async ({ body: { name, email, password, bio, skills } }) => {
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password,
                bio: bio || null,
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
            bio: t.String(),
            skills: t.Array(t.Object({
                name: t.String(),
                level: t.String()
            }))
        })
    })
    .patch("/:userId", async ({ params: { userId }, body: {
        name, email, password, bio, skills
    } }) => {

        let user = await prisma.user.findUnique({
            where: { id: userId }
        })
        if (!user) return error(400, "User not found!");
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password;
        if (bio) user.bio = bio;

        user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...user,
                skills: {
                    create: skills?.map((skill) => ({
                        name: skill.name,
                        level: skill.level,
                    })),
                }
            },
            include: { skills: true }
        })

        return { message: "User updated successfully!", user }
    }, {
        params: t.Object({
            userId: t.String()
        }),
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
    .delete("/:userId", async ({ params: { userId } }) => {
        const user = await prisma.user.delete({ where: { id: userId } });
        if (!user) return error(404, "User not found!");
        return { message: "User deleted successfully!", user }
    }, {
        params: t.Object({
            userId: t.String()
        })
    })