адрес репозитория с шаблоном проекта https://github.com/exemplar-codes/RNTemplate/tree/main

### android12_2.0.0 ########################################################### 
--> приложение запускается на устройстве
--> подключен блютуз.на стартовом экране меню подключения доступных устройств
--> установлен Redux и @redux-tool-kit
--> обновил react-native-bluetooth-classic@1.73.0-rc.12 --legacy-peer-deps !!!
--> от яблока и тестов почищен
# BUGS 28=02-2025
* приложение запускается на устройстве

* плата определяется в списке доступных

* при попытке подключиться всплывающий хинт о неудачной попытке соединения с esp32

* переходит на экран управления девайсом. тут же внизу всплывает "Non-serializable values were found in the n..." (далее скрыто)

!!! плата НЕ ОТВЕЧАЕТ на комманды !!!

* после нажатия ПОДКЛЮЧИТЬСЯ: 
  1.  Ошибка:
    _reactNativeBluetoothClassic.default.addListener is not a function (it is undefined)

   всплывающий хинт "Ошибка подключения: TypeError: _reactNative..." (далее скрыто)

  2. если игнорить, то при нажатиях на кнопки отправки сообщений "Включить LED" и "Выключить LED" пишутся логи на "экране управления" внизу

!!! плата ОТВЕЧАЕТ на команды!!! 
      но с некоторой задержкой около 600-800 мс. Задержка вероятнее всего из-за delay(1000) в коде на стороне ESP32

* при попытке отключиться по кнопке падает с ошибкой:
      RENDER ERROR
      removeDataListener is not a function (it is Object)




## Stuff added by me
1. RTK and react-redux
2. Some folder structure

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
