# The Connect Claustra

> ⚠️ The Connect Claustra has been discontinued and is not supported by Antville, anymore.

The Antville Connect Claustra provides means to login to an Antville installation by using third-party services.

Currently, the following services are supported:

* [Facebook](https://developers.facebook.com/docs/concepts/login/)
* [Google](https://developers.google.com/accounts/docs/OAuth2)
* [Twitter](http://dev.twitter.com/pages/sign_in_with_twitter)

## Installation

Add the `connect` folder to your `claustra` directory and enable the Claustra in your application’s `app.properties` file:

```properties
# Multiple claustra can be enabled comma-separated
claustra = connect
```

## Configuration

You need to obtain an application identifier and API key for each desired service and domain. These then define the following properties in the `app.properties` file:

```properties
claustra.connect.facebook.id = [App ID]
claustra.connect.facebook.key = [App Secret]

claustra.connect.twitter.id = [Consumer Key]
claustra.connect.twitter.key = [Consumer Secret]

claustra.connect.google.id = [Client ID]
claustra.connect.google.key = [Client Secret]
```

## Usage

If the Connect Claustra is enabled in an Antville installation the login page will list the available services:

![](https://raw.githubusercontent.com/wiki/antville/antville/images/connect/login.png)

*Note:* If you already have an account at the Antville installation it is suggested to login one more time with the usual credentials and not use any of the connect links, yet. 

Then, you can connect your Antville account with any of the services from within the profile page:

![](https://raw.githubusercontent.com/wiki/antville/antville/images/connect/profile.png)

Alternatively, you can enter your credentials in the login form and then click the desired “Login with...” link; if the entered username and password match an Antville account the latter will be used for connecting with the service.

Either way you choose, by clicking one of the “Login with...” or “Connect with...” links you will be redirected to the corresponding service.

Please follow the individual instructions in the browser window until you are redirected back to the Antville installation.

You now should be logged in and the profile page should reflect the services you are connected to by changing the corresponding link titles from “Connect with...” to “Disconnect from...”.

If you want to disconnect your account from any chosen service – e.g. because you want to connect a different account with the service – simply click the corresponding “Disconnect from...” link.

## Privacy

The Antville installation only stores a minimum of information retrieved from any of the third-party service. This encompasses the unique identifier of the service account as well as – if available and not already defined in the Antville profile – the corresponding e-mail address and profile URL.

Access to any further data or your content is neither required nor is any of such stored in the Antville database.

## Known issues

* This claustra does not work with custom domains because the APIs generally come with a single domain policy.
* Twitter does not provide an e-mail address via the current API. Thus, the installation’s default e-mail address is used and needs to be changed manually. Please do this or you will not be able to receive any notification messages, otherwise.
