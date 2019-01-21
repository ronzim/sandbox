# BOT HTTP API
# 763533825:AAEsXkIYKmJ7ts61ZE2QEFc0w5-Vmwwpcbs

# set hook API
# https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://hook.io/<hook-user>/<hook-name>

from telegram.ext import Updater
updater = Updater(token='763533825:AAEsXkIYKmJ7ts61ZE2QEFc0w5-Vmwwpcbs')

dispatcher = updater.dispatcher

import logging
logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)

def start(bot, update):
    bot.send_message(chat_id=update.message.chat_id, text="I'm a bot, please talk to me!")

from telegram.ext import CommandHandler
start_handler = CommandHandler('start', start)
dispatcher.add_handler(start_handler)

import json
def append(obj):
    previus_data = loadFile()
    previus_data.append(obj)
    with open('data.json', 'w+') as outfile:
        json.dump(previus_data, outfile)

def loadFile():
    with open('data.json') as f:
        data = json.load(f)
        return data

def parseMsg(msg):
    value = msg.text.split()
    if (len(value)<3):
        return
    print value[0]
    print value[1]
    return {'date':msg.date.strftime("%Y-%m-%d %H:%M:%S"), 'key':value[1], 'value':value[2]}

def something(bot, update):
    print update.message.date
    print update.message.text
    entry = parseMsg(update.message)
    append(entry)
    bot.send_message(chat_id=update.message.chat_id, text='---')

from telegram.ext import CommandHandler
something_handler = CommandHandler('something', something)
dispatcher.add_handler(something_handler)


def echo(bot, update):
    bot.send_message(chat_id=update.message.chat_id, text=update.message.text)

from telegram.ext import MessageHandler, Filters
echo_handler = MessageHandler(Filters.text, echo)
dispatcher.add_handler(echo_handler)

def unknown(bot, update):
    bot.send_message(chat_id=update.message.chat_id, text="Sorry, I didn't understand that command.")

unknown_handler = MessageHandler(Filters.command, unknown)
dispatcher.add_handler(unknown_handler)

updater.start_polling()
# updater.stop()
updater.idle()
