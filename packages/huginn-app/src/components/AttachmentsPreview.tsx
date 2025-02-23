import type { AttachmentType } from "@/types";
import { Transition } from "@headlessui/react";
import clsx from "clsx";
import { AnimatePresence, type Variants, motion } from "motion/react";
import Tooltip from "./tooltip/Tooltip";

export default function AttachmentsPreview(props: { attachments: AttachmentType[]; onRemove: (id: number) => void }) {
	const variants: Variants = {
		visible: (i) => ({
			scale: 1,
			opacity: 1,
			transition: { type: "spring", bounce: 0.2, delay: i * 0.1 },
		}),
		hidden: { scale: 0, opacity: 0 },
		exit: { opacity: 0, transition: { duration: 0.2 } },
	};

	return (
		<Transition show={props.attachments.length !== 0}>
			<div className="data h-[238px] overflow-hidden rounded-xl rounded-b-none border-2 border-background border-b-0 bg-tertiary px-2.5 py-2.5 pb-0 duration-200 data-[closed]:h-0 data-[closed]:py-0 data-[closed]:opacity-0">
				<div className="scroll-alternative-x relative flex h-full gap-x-5 overflow-y-hidden overflow-x-scroll px-2.5 py-2.5 pb-0">
					<AnimatePresence mode="popLayout">
						{props.attachments.map((x) => (
							<motion.div
								layout
								key={x.id}
								custom={x.id}
								variants={variants}
								initial="hidden"
								animate="visible"
								exit="exit"
								className="relative flex h-48 w-48 shrink-0 flex-col rounded-lg bg-background p-2"
							>
								<div className="-top-2 -right-2 absolute overflow-hidden rounded-md bg-background shadow-xl">
									<Tooltip>
										<Tooltip.Trigger className="p-1.5 hover:bg-secondary/50">
											<IconMingcuteEdit2Fill className="size-5 text-text" />
										</Tooltip.Trigger>
										<Tooltip.Content>Edit</Tooltip.Content>
									</Tooltip>
									<Tooltip>
										<Tooltip.Trigger className="p-1.5 hover:bg-secondary/50" onClick={() => props.onRemove(x.id)}>
											<IconMingcuteDelete2Fill className="size-5 text-error" />
										</Tooltip.Trigger>
										<Tooltip.Content>Delete</Tooltip.Content>
									</Tooltip>
								</div>
								<div className="flex h-full min-h-0 items-center justify-center rounded-md bg-secondary">
									{x.dataUrl ? (
										<img className="max-h-full max-w-full" loading="lazy" src={x.dataUrl} alt={x.filename} />
									) : (
										<IconMingcuteFileFill className="size-20 text-text" />
									)}
								</div>
								<div className="mt-2 w-full shrink-0 overflow-hidden text-ellipsis whitespace-nowrap text-white">{x.filename}</div>
							</motion.div>
						))}
					</AnimatePresence>
				</div>
			</div>
		</Transition>
	);
}
