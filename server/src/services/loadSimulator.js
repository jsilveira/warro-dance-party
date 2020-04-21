let usersCount = 0;

module.exports = {
  simulateLoad(app) {
    const createuser = async () => {
      if (usersCount > 200) {
        return;
      }

      usersCount++;
      let user = await app.service('users').create({email: 'User' + Math.random()});
      app.service('room').create({user});

      let sayTO = 0;
      setTimeout(createuser, Math.random() * (usersCount < 100 ? 10 : 5000));

      setTimeout(() => {
        app.service('room').remove(user.id);
        usersCount--;
        clearTimeout(sayTO);
      }, Math.random() * 60 * 1000);

      let sayMsg = async () => {
        let text = Math.random() > 0.98 ? 'a' + Math.random() : '🤛';
        await app.service('messages').create({text: text, user: {id: user.id, email: user.email}})
        sayTO = setTimeout(sayMsg, Math.random() * 50000)
      };
      sayMsg();
    };

    setTimeout(createuser, 2000);
  }
};
