const { AuthenticationService, JWTStrategy } = require('@feathersjs/authentication');
const { LocalStrategy } = require('@feathersjs/authentication-local');
const { OAuthStrategy, oauth } = require('@feathersjs/authentication-oauth');
// const { oauth2Redirect, oauth } = require('@feathersjs/express');

class GitHubStrategy extends OAuthStrategy {
  async getEntityData(profile) {
    const baseData = await super.getEntityData(profile);

    return {
      ...baseData,
      email: profile.email
    };
  }
}

module.exports = app => {
  const authService = new AuthenticationService(app);

  authService.register('jwt', new JWTStrategy());
  authService.register('local', new LocalStrategy());
  authService.register('github', new GitHubStrategy());

  app.use('/authentication', authService);
  app.configure(oauth({}))
  // app.use('/oauth/callback', oauth2Redirect());
};
