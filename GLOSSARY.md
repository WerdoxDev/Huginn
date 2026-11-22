# Huginn

Huginn is a chat application for private messaging, calls, and sharing activities. This glossary defines its shared product language.

## Language

### Identity and access

**Instance**:
An independently operated Huginn deployment with its own users and channels. One instance can have multiple access addresses.
_Avoid_: Server when referring to the whole deployment

**Access address**:
A public address through which a client reaches an instance. Different access addresses can lead to the same instance.
_Avoid_: Instance when referring only to an address, mirror instance

**User**:
A registered identity within a Huginn instance, with a username and profile.

**Username**:
A user's unique name within an instance.
_Avoid_: Display name when referring to the unique name

**Display name**:
An optional name shown in place of a user's username.
_Avoid_: Username when referring to the optional name

**Profile**:
A user's public presentation, including their names, avatar, biography, and badges.
_Avoid_: Account when referring only to public presentation

### Social relationships

**Relationship**:
One user's social connection to another user, described from the first user's perspective. An incoming friend request and an outgoing friend request describe opposite perspectives on the same request.
_Avoid_: Friendship when including pending requests

**Friend request**:
A proposal from one user to another to become friends, awaiting acceptance.
_Avoid_: Friendship before acceptance

**Friendship**:
A mutual social connection established by accepting a friend request.
_Avoid_: Relationship when specifically referring to an accepted friendship

### Channels

**Channel**:
A persistent place for messages and calls shared by its recipients.
_Avoid_: Conversation, chat room

**Direct channel**:
A private channel shared by its recipients, either a DM channel or a group DM channel.
_Avoid_: DM channel when including group DM channels

**DM channel**:
A direct channel between two users, with a shared message history that persists when either recipient closes it.
_Avoid_: Direct message when referring to the channel rather than an individual message

**Group DM channel**:
A direct channel with a changeable set of recipients and a channel owner. It remains a group DM channel even if only one recipient remains.
_Avoid_: Group conversation, group chat when naming the channel type

**Recipient**:
Any user belonging to a channel, including the current user and the channel owner. Recipients include all users belonging to the channel, regardless of whose perspective is being described.
_Avoid_: Member, channel member, participant when referring to channel membership

**Channel owner**:
The recipient responsible for a group DM channel, with authority to remove other recipients or transfer ownership.
_Avoid_: Owner without qualification when the context is ambiguous

### Messages and shared content

**Message**:
An entry in a channel's history containing user communication or a record of a channel event, such as a call or a recipient joining or leaving.
_Avoid_: Direct message when referring to every kind of message

**Reply**:
A message explicitly responding to another message.
_Avoid_: Thread when referring to a single reply

**Mention**:
An explicit reference in a message to a user or a channel audience, such as everyone or the channel owner.

**Attachment**:
A file included with a message, such as an image, document, or audio recording.
_Avoid_: Embed when referring to an attached file

**Embed**:
A rich presentation within a message, such as a link preview or a representation of shared media.
_Avoid_: Attachment when referring to a rich presentation

**Media viewer**:
An enlarged view within Huginn of an image, video, GIF, or sticker.
_Avoid_: Fullscreen when referring to enlargement within Huginn

**Reaction**:
A user's emoji response attached to a particular message.
_Avoid_: Reply when referring to an emoji response

**Pinned message**:
A message highlighted in a channel's shared collection of pins.
_Avoid_: Pinned channel, bookmark

**Read state**:
A user's reading progress in one channel, identifying the last message marked as read and how many messages from others remain unread.
_Avoid_: Read receipt when referring to the user's own reading progress

**Expression**:
A reusable GIF or sticker that can be shared in messages, whether uploaded or obtained from a media provider.
_Avoid_: Emoji when referring to a GIF or sticker

**Expression collection**:
A user's personal collection of GIFs or stickers, including expressions they have saved, uploaded, or sent. Removing an expression from the collection leaves previously sent messages and other users' collections intact.
_Avoid_: Favorites when referring to the whole collection

### Calls and presence

**Call**:
A live communication session associated with a channel, supporting microphone audio, camera video, and shared streams.
_Avoid_: Voice message, channel when referring to the live session

**Call message**:
An entry in a channel's history recording a call, including who participated and whether it has ended.
_Avoid_: Active call when referring to the historical entry

**Call participant**:
A user who has joined a particular call. A channel recipient who has not joined that call is not a call participant.
_Avoid_: Recipient when specifically referring to participation in a call

**Stream**:
Audio, video, or both shared during a call separately from the microphone and camera, such as a screen share or music broadcast.
_Avoid_: Screen share when the stream is audio only

**Presence**:
A user's shared availability and activities, considered across their connected clients.
_Avoid_: Status when referring to both availability and activities

**Presence status**:
A user's availability, such as online, idle, do not disturb, invisible, or offline.
_Avoid_: Status without qualification when the context is ambiguous

**Activity**:
Something a user is playing or listening to that is shared as part of their presence.
_Avoid_: Game when referring to listening activity

### Application recognition

**Application**:
A software title that can be recognized as part of a user's activity, including games and other software.
_Avoid_: Game when referring to applications generally

**Known application**:
An application identified in the application catalog, with a canonical name and any alternative names.
_Avoid_: Known game

**Application catalog**:
The collection of known applications and the matchers used to recognize them.
_Avoid_: Game catalog

**Application matcher**:
A platform-specific recognition rule that identifies a running application as a particular known application.
_Avoid_: Game matcher

**Application contribution**:
A user's submission of information about an observed application for review and improvement of the application catalog.
_Avoid_: Game contribution, contribution without qualification when the context is ambiguous
