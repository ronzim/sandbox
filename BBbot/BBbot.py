# BOT HTTP API
# 763533825:AAEsXkIYKmJ7ts61ZE2QEFc0w5-Vmwwpcbs

# set hook API
# https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://hook.io/<hook-user>/<hook-name>

import os
import json
import logging
import telegram
import datetime
from telegram.ext import Updater
from telegram.ext import CommandHandler
from telegram.ext import MessageHandler, Filters

global current_value
global storageFile
storageFile = 'data.json'

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.INFO)
updater = Updater(token='763533825:AAEsXkIYKmJ7ts61ZE2QEFc0w5-Vmwwpcbs')
dispatcher = updater.dispatcher

def start(bot, update):
    bot.send_message(chat_id=update.message.chat_id, text="I'm a bot, please talk to me!")

def append(obj):
    previus_data = loadFile()
    previus_data.append(obj)
    global storageFile
    with open(storageFile, 'w+') as outfile:
        json.dump(previus_data, outfile)

def loadFile():
    global storageFile
    with open(storageFile) as f:
        data = json.load(f)
        return data

def clearFile(bot, update):
    global storageFile
    today = datetime.date.today()
    # os.remove(storageFile)
    os.rename(storageFile, storageFile.split('.')[0] + today.strftime("%b-%d-%Y") + '.json')
    with open(storageFile, 'w+') as outfile:
        json.dump([], outfile)
    bot.send_message(chat_id=update.message.chat_id, text='storage cleared')
    return

def parseMsg(msg):
    # value = msg.text.split()
    # if (len(value)>1):
    #     return False
    return {'date':msg.date.strftime("%Y-%m-%d %H:%M:%S"), 'key': msg.text, 'value':current_value}

def read_storage(bot, update):
    bot.send_message(chat_id=update.message.chat_id, text='--- init storage ---')
    storage = loadFile()
    for l in range(0, len(storage)):
        entry = storage[l]
        if not entry: continue
        line = entry['date'] + ' || ' + entry['key'] + ' || ' + str(entry['value'])
        bot.send_message(chat_id=update.message.chat_id, text=line)
    bot.send_message(chat_id=update.message.chat_id, text='--- end storage ---')

def registerEntry(bot, msg):
    # if (not entry):
    #     bot.send_message(chat_id=update.message.chat_id, text='not enough arguments')
    #     return
    entry = parseMsg(msg)
    entry['value'] = current_value
    append(entry)
    print entry
    ans = 'registered >> ' + entry['date'] + ' || ' + str(entry['key']) + ' || ' + str(entry['value'])
    bot.send_message(chat_id=msg.chat_id, text=ans)
    global current_value
    current_value = None

def delete_last(bot, update):
    previus_data = loadFile()
    if len(previus_data) == 0:
        bot.send_message(chat_id=update.message.chat_id, text='storage empty')
        return
    del previus_data[-1]
    global storageFile
    with open(storageFile, 'w+') as outfile:
        json.dump(previus_data, outfile)
    bot.send_message(chat_id=update.message.chat_id, text='deleted')

categories = [
    'benzina',
    'auto',
    'pranzo',
    'cena/ape',
    'postcena',
    'acquisti',
    'cane',
    'viaggi',
    'altro',
    '/getstorage',
    '/clearstorage',
    '/delete_last'
]

def handle_msg(bot, update):
    if update.message.text in categories:
        registerEntry(bot, update.message)
    else:
        # TODO check if numeric value
        global current_value
        current_value = update.message.text
    # reply_keyboard = [[telegram.KeyboardButton(text='aaa'), telegram.KeyboardButton(text='/bbb')]]
    # close_btn = [telegram.KeyboardButton(telegram.KeyboardEnum.CANCEL.clean())]
        reply_keyboard = []
        for c in range(0, len(categories)/3):
            keyboard_line = [
                telegram.KeyboardButton(text=categories[c*3]),
                telegram.KeyboardButton(text=categories[c*3+1]),
                telegram.KeyboardButton(text=categories[c*3+2])
            ]
            reply_keyboard.append(keyboard_line)
        close_btn = [telegram.KeyboardButton('close')]
        bot.sendMessage(chat_id=update.message.chat_id, text='scelta categoria', parse_mode='HTML',
                        reply_markup=telegram.ReplyKeyboardMarkup(reply_keyboard, footer_buttons=close_btn, one_time_keyboard=True))

def unknown(bot, update):
    bot.send_message(chat_id=update.message.chat_id, text="Sorry, I didn't understand that command.")

# handlers binding
start_handler = CommandHandler('start', start)
dispatcher.add_handler(start_handler)
getstorage_handler = CommandHandler('getstorage', read_storage)
dispatcher.add_handler(getstorage_handler)
clearstorage_handler = CommandHandler('clearstorage', clearFile)
dispatcher.add_handler(clearstorage_handler)
deletelast_handler = CommandHandler('deletelast', delete_last)
dispatcher.add_handler(deletelast_handler)
msg_handler = MessageHandler(Filters.text, handle_msg)
dispatcher.add_handler(msg_handler)
unknown_handler = MessageHandler(Filters.command, unknown)
dispatcher.add_handler(unknown_handler)

# start bot
updater.start_polling()
# updater.stop()
updater.idle()
