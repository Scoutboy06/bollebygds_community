const { MessageEmbed } = require('discord.js');


function embed({ color, type, title, fields, author, desc, description, footer, image, thumbnail, timestamp, url, files }) {
	const errorColor = 0xffcc4d;
	const defaultColor = 0x61aeee;
	
	const e = new MessageEmbed();
	
	if(type === 'error') e.setColor(errorColor);
	else if(color) e.setColor(color);
	else e.setColor(defaultColor);

	if(title) e.setTitle(title);
	if(fields) e.setFields(fields);
	if(author) e.setAuthor(author);
	if(desc || description) e.setDescription(desc || description);
	if(footer) e.setFooter(footer);
	if(image) e.setImage(image);
	if(thumbnail) e.setThumbnail(thumbnail);
	if(timestamp) e.setTimestamp(timestamp);
	if(url) e.setURL(url);
	if(files) e.attachFiles(files);

	return e;
}


module.exports = embed;