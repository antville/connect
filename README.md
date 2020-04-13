# The Connect Claustra

> ⚠️ The Connect Claustra has been discontinued and is not supported by Antville, anymore.

This Claustra implements federated authentication via social networks.

Currently, the following social networks are supported:

* Facebook
* Google+
* Twitter

## Installation

Add the `connect` folder to your `claustra` directory and enable the Claustra in your application’s `app.properties` file:

```bash
# Multiple claustra can be enabled comma-separated
claustra = connect
```

## Configuration

```properties
claustra.connect.facebook.id = [App ID]
claustra.connect.facebook.key = [App Secret]

claustra.connect.twitter.id = [Consumer Key]
claustra.connect.twitter.key = [Consumer Secret]

claustra.connect.google.id = [Client ID]
claustra.connect.google.key = [Client Secret]
```
