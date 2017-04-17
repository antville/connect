# The Connect Claustra

This claustra implements federated authentication via social networks.

Currently, the following social networks are supported:

* Facebook
* Google+
* Twitter

## Installation

Add the `connect` folder to your claustra directory and enable the claustra in your application’s `app.properties` file:

```bash
# Multiple claustra can be enabled comma-separated
claustra = connect
```

## Configuration

```
claustra.connect.facebook.id = [App ID]
claustra.connect.facebook.key = [App Secret]

claustra.connect.twitter.id = [Consumer Key]
claustra.connect.twitter.key = [Consumer Secret]

claustra.connect.google.id = [Client ID]
claustra.connect.google.key = [Client Secret]
```
