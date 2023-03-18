import { InteractionType } from "discord-interactions";
import { z } from "zod";

type BaseInteraction = z.infer<typeof baseInteraction>;
type PingInteraction = z.infer<typeof pingInteraction> & BaseInteraction;
type ApplicationCommandInteraction = z.infer<
	typeof applicationCommandInteraction
> &
	BaseInteraction;
type MessageComponentInteraction = z.infer<typeof messageComponentInteraction> &
	BaseInteraction;
type ApplicationCommandAutoCompleteInteraction = z.infer<
	typeof applicationCommandAutocompleteInteraction
> &
	BaseInteraction;
type ModalSubmitInteraction = z.infer<typeof modalSubmitInteraction> &
	BaseInteraction;

export type Interaction =
	| PingInteraction
	| ApplicationCommandInteraction
	| MessageComponentInteraction
	| ApplicationCommandAutoCompleteInteraction
	| ModalSubmitInteraction;

export function parseInteractionBody(rawBody: string) {
	const body = JSON.parse(rawBody);
	console.log(body);

	const result = interaction.safeParse(body);

	if (!result.success) {
		//console.error("Invalid request body", JSON.stringify(result.error));
		console.log(result.error.issues);
		throw result.error;
	}

	return result.data as Interaction;
}

const userObject = z
	.object({
		id: z.string(),
		username: z.string(),
		discriminator: z.string(),
		avatar: z.string().optional(),
		bot: z.boolean().optional(),
		system: z.boolean().optional(),
		mfa_enabled: z.boolean().optional(),
		banner: z.string().optional(),
		verified: z.boolean().optional(),
	})
	.passthrough();

const messageObject = z
	.object({
		id: z.string(),
		channel_id: z.string(),
		author: userObject,
		content: z.string(),
		timestamp: z.string(),
		edited_timestamp: z.string().optional(),
		tts: z.boolean().optional(),
		mention_everyone: z.boolean().optional(),
		mentions: z.array(userObject).optional(),
		type: z.number(),
	})
	.passthrough();

const guildMemberObject = z
	.object({
		user: userObject.optional(),
		nick: z.string().nullable().optional(),
		avatar: z.string().nullable().optional(),
		roles: z.array(z.string()).optional(),
		joined_at: z.string().nullable().optional(),
		premium_since: z.string().nullable().optional(),
		permissions: z.string().nullable().optional(),
	})
	.passthrough();

const baseInteraction = z
	.object({
		id: z.string(),
		application_id: z.string(),
		type: z.nativeEnum(InteractionType),
		guild_id: z.string().optional(),
		channel_id: z.string().optional(),
		token: z.string(),
		version: z.number(),
		app_permissions: z.string().optional(),
		local: z.string().optional(),
		guild_locale: z.string().optional(),
		member: guildMemberObject.optional(),
		user: userObject.optional(),
		message: messageObject.optional(),
	})
	.passthrough();

const pingInteraction = z.object({
	type: z.literal(InteractionType.PING),
});

const applicationCommandData = z
	.object({
		id: z.string(),
		name: z.string(),
		type: z.number(),
		options: z
			.array(
				z
					.object({
						name: z.string(),
						type: z.number(),
						value: z.union([z.string(), z.number(), z.boolean()]).optional(),
					})
					.passthrough()
			)
			.optional(),
	})
	.passthrough();

type ApplicationCommandInteractionData = z.infer<typeof applicationCommandData>;
const applicationCommandInteraction = z.object({
	type: z.literal(InteractionType.APPLICATION_COMMAND),
	data: applicationCommandData,
});

const applicationCommandAutocompleteInteraction = z.object({
	type: z.literal(InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE),
	data: applicationCommandData.partial(),
});

const messageComponentData = z
	.object({
		custom_id: z.string(),
		component_type: z.number(),
		values: z.array(z.any()).optional(),
	})
	.passthrough();

const messageComponentInteraction = z.object({
	type: z.literal(InteractionType.MESSAGE_COMPONENT),
	data: messageComponentData,
});

const modalSubmitData = z
	.object({
		custom_id: z.string(),
		components: z.array(messageComponentData),
	})
	.passthrough();

const modalSubmitInteraction = z.object({
	type: z.literal(InteractionType.MODAL_SUBMIT),
	data: modalSubmitData,
});

const interactionTypes = z.union([
	pingInteraction,
	applicationCommandInteraction,
	applicationCommandAutocompleteInteraction,
	messageComponentInteraction,
	modalSubmitInteraction,
]);

const interaction = baseInteraction.and(interactionTypes);
