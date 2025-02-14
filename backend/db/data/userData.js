const bcrypt = require("bcryptjs");

const users = [
    {
    firstName: 'Demoo',
    lastName: 'Lit',
    email: 'demo@user.io',
    username: 'Demo-lition',
    hashedPassword: bcrypt.hashSync('password')
    },
    {
    firstName: 'Farkle',
    lastName: 'Ueser',
    email: 'user1@user.io',
    username: 'FakeUser1',
    hashedPassword: bcrypt.hashSync('password1')
    },
    {
    firstName: 'Joe',
    lastName: 'Exotic',
    email: 'user2@user.io',
    username: 'FKCRLBSKNS',
    hashedPassword: bcrypt.hashSync('password2')
    },
    {
    firstName: 'Tom',
    lastName: 'Bombadil',
    email: 'user3@user.io',
    username: 'TheBombDotTom',
    hashedPassword: bcrypt.hashSync('password3')
    },
    {
    firstName: 'Eddie',
    lastName: 'Brock',
    email: 'user4@user.io',
    username: 'TheSymbiGOAT',
    hashedPassword: bcrypt.hashSync('password4')
    },
    {
    firstName: 'Fry',
    lastName: 'Lock',
    email: 'user5@user.io',
    username: 'GreasyMagic',
    hashedPassword: bcrypt.hashSync('password5')
    },
    {
    firstName: 'Meat',
    lastName: 'Wad',
    email: 'user6@user.io',
    username: 'IglooHotdog',
    hashedPassword: bcrypt.hashSync('password6')
    },
    {
    firstName: 'Carl',
    lastName: 'Brutananadilewski',
    email: 'user7@user.io',
    username: 'FreakinAwesome83',
    hashedPassword: bcrypt.hashSync('password7')
    },
    {
    firstName: 'Egon',
    lastName: 'Spengler',
    email: 'user8@user.io',
    username: 'BigTwinkie',
    hashedPassword: bcrypt.hashSync('password8')
    },
    {
    firstName: 'Emmet',
    lastName: 'Brown',
    email: 'user9@user.io',
    username: 'OutaTime',
    hashedPassword: bcrypt.hashSync('password9')
    },
]

module.exports = users;